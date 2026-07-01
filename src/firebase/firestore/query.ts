import { collection, getDocs, limit, onSnapshot, query, where, type CollectionReference, type QueryConstraint, type WhereFilterOp } from 'firebase/firestore'
import type { Ref } from 'vue'
import { db } from '../init'

const fetchLimit = 200

export interface FirestoreWhereQuery {
    name: string
    operator: WhereFilterOp
    value: unknown
}

export const getFirestoreCollectionWithWhereQuery = async <T extends Record<string, unknown>>(
    collectionName: string,
    arrayRef: Ref<T[]>,
    ...queries: FirestoreWhereQuery[]
): Promise<T[]> => {
    const collectionRef: CollectionReference = collection(db, collectionName)
    const queryConstraints: QueryConstraint[] = [limit(fetchLimit)]
    queries.forEach(queryParam => queryConstraints.push(where(queryParam.name, queryParam.operator, queryParam.value)))
    const firestoreQuery = query(collectionRef, ...queryConstraints)

    return new Promise((resolve, reject) => {
        onSnapshot(firestoreQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const changeData = { id: change.doc.id, ...change.doc.data() } as unknown as T
                if (change.type === 'added') {
                    const existingItem = arrayRef.value.find(item => item.id === changeData.id)
                    if (!existingItem) arrayRef.value.push(changeData)
                } else if (change.type === 'modified') {
                    const index = arrayRef.value.findIndex(item => item.id === changeData.id)
                    if (index >= 0) arrayRef.value[index] = changeData
                    else arrayRef.value.push(changeData)
                } else if (change.type === 'removed') {
                    arrayRef.value = arrayRef.value.filter(item => item.id !== changeData.id)
                }
            })
            resolve(arrayRef.value)
        }, reject)
    })
}

export const getFirestoreSubCollectionWithWhereQuery = async <T extends Record<string, unknown>>(
    collectionName: string,
    documentName: string,
    subCollectionName: string,
    arrayRef: Ref<T[]>,
    ...queries: FirestoreWhereQuery[]
): Promise<T[]> => {
    const subCollectionRef: CollectionReference = collection(db, collectionName, documentName, subCollectionName)
    const queryConstraints = queries.map(queryParam => where(queryParam.name, queryParam.operator, queryParam.value))
    const firestoreQuery = query(subCollectionRef, ...queryConstraints)

    return new Promise((resolve, reject) => {
        onSnapshot(firestoreQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const changeData = { id: change.doc.id, ...change.doc.data() } as unknown as T
                if (change.type === 'added') {
                    const existingItem = arrayRef.value.find(item => item.id === changeData.id)
                    if (!existingItem) arrayRef.value.push(changeData)
                } else if (change.type === 'modified') {
                    const index = arrayRef.value.findIndex(item => item.id === changeData.id)
                    if (index >= 0) arrayRef.value[index] = changeData
                    else arrayRef.value.push(changeData)
                } else if (change.type === 'removed') {
                    arrayRef.value = arrayRef.value.filter(item => item.id !== changeData.id)
                }
            })
            resolve(arrayRef.value)
        }, reject)
    })
}

export const getFirestoreCollectionWithWhereQueryOnce = async <T extends Record<string, unknown>>(
    collectionName: string,
    ...queries: FirestoreWhereQuery[]
): Promise<T[]> => {
    const collectionRef: CollectionReference = collection(db, collectionName)
    const queryConstraints: QueryConstraint[] = [limit(fetchLimit)]
    queries.forEach(queryParam => queryConstraints.push(where(queryParam.name, queryParam.operator, queryParam.value)))
    const snapshot = await getDocs(query(collectionRef, ...queryConstraints))
    return snapshot.docs.map(item => ({ id: item.id, ...item.data() } as unknown as T))
}