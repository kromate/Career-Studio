import { collection, doc, getDoc, limit, onSnapshot, query, type FirestoreError, type Query, type QuerySnapshot } from 'firebase/firestore'
import type { Ref } from 'vue'
import { db } from '../init'

const fetchLimit = 300

type FindFn<T> = (item: T, change: T) => boolean

export const getSingleFirestoreDocument = async <T extends Record<string, unknown>>(
    collectionName: string,
    id: string,
    documentRef: Ref<T | null>,
): Promise<T | null> => {
    try {
        const snapshot = await getDoc(doc(db, collectionName, id))
        documentRef.value = snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as unknown as T) : null
        return documentRef.value
    } catch (error) {
        documentRef.value = null
        throw error
    }
}

export const getSingleFirestoreSubDocument = async <T extends Record<string, unknown>>(
    collectionName: string,
    documentName: string,
    subCollectionName: string,
    id: string,
    documentRef: Ref<T | null>,
): Promise<T | null> => {
    try {
        const snapshot = await getDoc(doc(db, collectionName, documentName, subCollectionName, id))
        documentRef.value = snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as unknown as T) : null
        return documentRef.value
    } catch (error) {
        documentRef.value = null
        throw error
    }
}

export const getFirestoreCollection = async <T extends Record<string, unknown>>(
    collectionName: string,
    arrayRef: Ref<T[]>,
    findFn: FindFn<T> = (item, change) => item.id === change.id,
): Promise<() => void> => {
    const collectionRef = collection(db, collectionName)
    return listenToQuery(query(collectionRef, limit(fetchLimit)), arrayRef, findFn)
}

export const getFirestoreSubCollection = async <T extends Record<string, unknown>>(
    collectionName: string,
    documentName: string,
    subCollectionName: string,
    arrayRef: Ref<T[]>,
    findFn: FindFn<T> = (item, change) => item.id === change.id,
): Promise<() => void> => {
    const collectionRef = collection(db, collectionName, documentName, subCollectionName)
    return listenToQuery(query(collectionRef, limit(fetchLimit)), arrayRef, findFn)
}

export const getSingleFirestoreSubSubDocument = async <T extends Record<string, unknown>>(
    collectionName: string,
    documentName: string,
    subCollectionName: string,
    subDocumentName: string,
    subSubCollectionName: string,
    id: string,
    documentRef: Ref<T | null>,
): Promise<T | null> => {
    try {
        const snapshot = await getDoc(doc(db, collectionName, documentName, subCollectionName, subDocumentName, subSubCollectionName, id))
        documentRef.value = snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as unknown as T) : null
        return documentRef.value
    } catch (error) {
        documentRef.value = null
        throw error
    }
}

export const getFirestoreSubSubCollection = async <T extends Record<string, unknown>>(
    collectionName: string,
    documentName: string,
    subCollectionName: string,
    subDocumentName: string,
    subSubCollectionName: string,
    arrayRef: Ref<T[]>,
    findFn: FindFn<T> = (item, change) => item.id === change.id,
): Promise<() => void> => {
    const collectionRef = collection(db, collectionName, documentName, subCollectionName, subDocumentName, subSubCollectionName)
    return listenToQuery(query(collectionRef, limit(fetchLimit)), arrayRef, findFn)
}

function listenToQuery<T extends Record<string, unknown>>(
    firestoreQuery: Query,
    arrayRef: Ref<T[]>,
    findFn: FindFn<T>,
): Promise<() => void> {
    return new Promise((resolve, reject) => {
        try {
            const unsubscribe = onSnapshot(firestoreQuery, (snapshot: QuerySnapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const changeData = { id: change.doc.id, ...change.doc.data() } as unknown as T
                    if (change.type === 'added') {
                        const existingItem = arrayRef.value.find(item => findFn(item, changeData))
                        if (!existingItem) arrayRef.value.push(changeData)
                    } else if (change.type === 'modified') {
                        const index = arrayRef.value.findIndex(item => findFn(item, changeData))
                        if (index >= 0) arrayRef.value[index] = changeData
                        else arrayRef.value.push(changeData)
                    } else if (change.type === 'removed') {
                        arrayRef.value = arrayRef.value.filter(item => !findFn(item, changeData))
                    }
                })
                resolve(unsubscribe)
            }, (error: FirestoreError) => {
                arrayRef.value = []
                reject(error)
            })
        } catch (error) {
            arrayRef.value = []
            reject(error)
        }
    })
}