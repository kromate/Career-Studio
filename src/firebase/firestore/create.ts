import { doc, setDoc, updateDoc, type DocumentData, type SetOptions, type UpdateData } from 'firebase/firestore'
import { db } from '../init'
import { createFirestoreId } from './utils'

export const setFirestoreDocument = async (
    collectionName: string,
    id: string = createFirestoreId(),
    data: DocumentData,
    options?: SetOptions,
): Promise<string> => {
    await setDoc(doc(db, collectionName, id), data, options || {})
    return id
}

export const setFirestoreSubDocument = async (
    collectionName: string,
    documentName: string,
    subCollectionName: string,
    id: string = createFirestoreId(),
    data: DocumentData,
    options?: SetOptions,
): Promise<string> => {
    await setDoc(doc(db, collectionName, documentName, subCollectionName, id), data, options || {})
    return id
}

export const setFirestoreSubSubDocument = async (
    collectionName: string,
    documentName: string,
    subCollectionName: string,
    subDocumentName: string,
    subSubCollectionName: string,
    id: string = createFirestoreId(),
    data: DocumentData,
    options?: SetOptions,
): Promise<string> => {
    await setDoc(
        doc(db, collectionName, documentName, subCollectionName, subDocumentName, subSubCollectionName, id),
        data,
        options || {},
    )
    return id
}

export const updateFirestoreSubSubDocument = async (
    collectionName: string,
    documentName: string,
    subCollectionName: string,
    subDocumentName: string,
    subSubCollectionName: string,
    id: string,
    data: UpdateData<DocumentData>,
): Promise<void> => {
    await updateDoc(
        doc(db, collectionName, documentName, subCollectionName, subDocumentName, subSubCollectionName, id),
        data,
    )
}