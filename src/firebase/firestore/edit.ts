import { doc, updateDoc, type DocumentData, type UpdateData } from 'firebase/firestore'
import { db } from '../init'

export const updateFirestoreDocument = async (
    collectionName: string,
    id: string,
    data: UpdateData<DocumentData>,
): Promise<void> => {
    await updateDoc(doc(db, collectionName, id), data)
}

export const updateFirestoreSubDocument = async (
    collectionName: string,
    documentName: string,
    subCollectionName: string,
    id: string,
    data: UpdateData<DocumentData>,
): Promise<void> => {
    await updateDoc(doc(db, collectionName, documentName, subCollectionName, id), data)
}