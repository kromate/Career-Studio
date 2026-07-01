import { deleteDoc, doc } from 'firebase/firestore'
import { db } from '../init'

export const deleteFirestoreDocument = async (
    collectionName: string,
    id: string,
): Promise<void> => {
    await deleteDoc(doc(db, collectionName, id))
}

export const deleteFirestoreSubCollectionDocument = async (
    collectionName: string,
    documentName: string,
    subCollectionName: string,
    id: string,
): Promise<void> => {
    await deleteDoc(doc(db, collectionName, documentName, subCollectionName, id))
}

export const deleteFirestoreSubSubDocument = async (
    collectionName: string,
    documentName: string,
    subCollectionName: string,
    subDocumentName: string,
    subSubCollectionName: string,
    id: string,
): Promise<void> => {
    await deleteDoc(doc(db, collectionName, documentName, subCollectionName, subDocumentName, subSubCollectionName, id))
}