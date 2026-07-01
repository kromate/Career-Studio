import { collection, getCountFromServer, limit, query, where, type WhereFilterOp } from 'firebase/firestore'
import { db } from '../init'

const fetchLimit = 20

export const getFirestoreSubCollectionCountWithWhereQuery = async (
    collectionName: string,
    documentName: string,
    subCollectionName: string,
    queryParam: { name: string; operator: WhereFilterOp; value: unknown },
): Promise<number> => {
    const collectionRef = collection(db, collectionName, documentName, subCollectionName)
    const snapshot = await getCountFromServer(query(
        collectionRef,
        limit(fetchLimit),
        where(queryParam.name, queryParam.operator, queryParam.value),
    ))
    return snapshot.data().count
}

export const getFirestoreSubCollectionCount = async (
    collectionName: string,
    documentName: string,
    subCollectionName: string,
): Promise<number> => {
    const collectionRef = collection(db, collectionName, documentName, subCollectionName)
    const snapshot = await getCountFromServer(collectionRef)
    return snapshot.data().count
}