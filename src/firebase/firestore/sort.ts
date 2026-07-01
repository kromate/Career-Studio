import { collection, getDocs, limit, onSnapshot, orderBy, query, startAfter, type OrderByDirection, type QueryDocumentSnapshot } from 'firebase/firestore'
import type { Ref } from 'vue'
import { db } from '../init'

const fetchLimit = 250

export interface FirestoreSort {
    name: string
    order: OrderByDirection
}

const toSortableValue = (value: unknown): number | string => {
    if (!value) return 0
    if (typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
        const timestamp = value as { seconds: number; nanoseconds: number }
        return timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1e6)
    }
    if (typeof value === 'string') {
        const timestamp = Date.parse(value)
        return Number.isNaN(timestamp) ? value : timestamp
    }
    if (value instanceof Date) return value.getTime()
    return typeof value === 'number' ? value : String(value)
}

const sortArrayInPlace = <T extends Record<string, unknown>>(array: T[], field: string, order: OrderByDirection) => {
    array.sort((left, right) => {
        const leftValue = toSortableValue(left[field])
        const rightValue = toSortableValue(right[field])
        if (leftValue === rightValue) return 0
        const comparison = leftValue < rightValue ? -1 : 1
        return order === 'asc' ? comparison : -comparison
    })
}

export const getFirestoreCollectionWithSort = async <T extends Record<string, unknown>>(
    collectionName: string,
    arrayRef: Ref<T[]>,
    sort: FirestoreSort,
): Promise<T[]> => {
    const collectionRef = collection(db, collectionName)
    const firestoreQuery = query(collectionRef, limit(fetchLimit), orderBy(sort.name, sort.order))

    return new Promise((resolve) => {
        onSnapshot(firestoreQuery, (snapshot) => {
            applySnapshotChanges(snapshot.docChanges().map(change => ({
                type: change.type,
                data: { id: change.doc.id, ...change.doc.data() } as unknown as T,
            })), arrayRef)
            sortArrayInPlace(arrayRef.value, sort.name, sort.order)
            resolve(arrayRef.value)
        })
    })
}

export const getFirestoreSubCollectionWithSort = async <T extends Record<string, unknown>>(
    collectionName: string,
    documentName: string,
    subCollectionName: string,
    arrayRef: Ref<T[]>,
    sort: FirestoreSort,
): Promise<T[]> => {
    const collectionRef = collection(db, collectionName, documentName, subCollectionName)
    const firestoreQuery = query(collectionRef, limit(fetchLimit), orderBy(sort.name, sort.order))

    return new Promise((resolve) => {
        onSnapshot(firestoreQuery, (snapshot) => {
            applySnapshotChanges(snapshot.docChanges().map(change => ({
                type: change.type,
                data: { id: change.doc.id, ...change.doc.data() } as unknown as T,
            })), arrayRef)
            sortArrayInPlace(arrayRef.value, sort.name, sort.order)
            resolve(arrayRef.value)
        })
    })
}

export const getFirestoreSubCollectionWithSortAndPagination = async <T extends Record<string, unknown>>(
    collectionName: string,
    documentName: string,
    subCollectionName: string,
    sort: FirestoreSort,
    limitCount = 5,
    startAfterDoc: QueryDocumentSnapshot | null = null,
): Promise<{ records: T[]; lastVisible: QueryDocumentSnapshot | null }> => {
    const collectionRef = collection(db, collectionName, documentName, subCollectionName)
    const firestoreQuery = startAfterDoc
        ? query(collectionRef, orderBy(sort.name, sort.order), startAfter(startAfterDoc), limit(limitCount))
        : query(collectionRef, orderBy(sort.name, sort.order), limit(limitCount))
    const snapshot = await getDocs(firestoreQuery)
    return {
        records: snapshot.docs.map(item => ({ id: item.id, ...item.data() } as unknown as T)),
        lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
    }
}

function applySnapshotChanges<T extends Record<string, unknown>>(
    changes: Array<{ type: 'added' | 'modified' | 'removed'; data: T }>,
    arrayRef: Ref<T[]>,
) {
    changes.forEach((change) => {
        if (change.type === 'added') {
            const existingItem = arrayRef.value.find(item => item.id === change.data.id)
            if (!existingItem) arrayRef.value.push(change.data)
        } else if (change.type === 'modified') {
            const changedArray = arrayRef.value.filter(item => item.id !== change.data.id)
            arrayRef.value = [...changedArray, change.data]
        } else if (change.type === 'removed') {
            arrayRef.value = arrayRef.value.filter(item => item.id !== change.data.id)
        }
    })
}