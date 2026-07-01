import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { deleteObject, getBlob, getDownloadURL, ref as storageRef, uploadBytes, type UploadMetadata } from 'firebase/storage'
import type { WorkspaceState } from '@/types'
import { db, storage } from './init'

const careerStudioBundleId = 'career-studio'
const workspaceDocumentId = 'current'

export interface CareerStudioStorageObject {
    fullPath: string
    downloadURL?: string
}

export function careerStudioBundlePath(accountId: string): string {
    return `accounts/${accountId}/bundles/${careerStudioBundleId}`
}

export function careerStudioWorkspacePath(accountId: string): string {
    return `${careerStudioBundlePath(accountId)}/workspaces/${workspaceDocumentId}`
}

function workspaceDoc(accountId: string) {
    return doc(db, 'accounts', accountId, 'bundles', careerStudioBundleId, 'workspaces', workspaceDocumentId)
}

function cleanForFirestore<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T
}

export async function readCareerStudioWorkspace(accountId: string): Promise<WorkspaceState | null> {
    const snapshot = await getDoc(workspaceDoc(accountId))
    if (!snapshot.exists()) return null

    const data = snapshot.data() as { state?: WorkspaceState }
    if (!data.state) return null

    return { ...data.state, hydrated: true }
}

export async function writeCareerStudioWorkspace(
    accountId: string,
    state: WorkspaceState,
): Promise<void> {
    await setDoc(workspaceDoc(accountId), {
        account_id: accountId,
        app_id: careerStudioBundleId,
        schema_version: state.schemaVersion,
        state: cleanForFirestore({ ...state, hydrated: true }),
        updated_at: serverTimestamp(),
    }, { merge: true })
}

export async function deleteCareerStudioWorkspace(accountId: string): Promise<void> {
    await deleteDoc(workspaceDoc(accountId))
}

export async function uploadCareerStudioStorageObject(
    accountId: string,
    path: string,
    data: Blob | Uint8Array | ArrayBuffer,
    metadata?: UploadMetadata,
): Promise<CareerStudioStorageObject> {
    const fullPath = `${careerStudioBundlePath(accountId)}/${path.replace(/^\/+/, '')}`
    const snapshot = await uploadBytes(storageRef(storage, fullPath), data, metadata)
    try {
        return {
            fullPath: snapshot.ref.fullPath,
            downloadURL: await getDownloadURL(snapshot.ref),
        }
    } catch {
        return { fullPath: snapshot.ref.fullPath }
    }
}

export async function readCareerStudioStorageObject(accountId: string, path: string): Promise<Blob> {
    return getBlob(storageRef(storage, `${careerStudioBundlePath(accountId)}/${path.replace(/^\/+/, '')}`))
}

export async function deleteCareerStudioStorageObject(accountId: string, path: string): Promise<void> {
    await deleteObject(storageRef(storage, `${careerStudioBundlePath(accountId)}/${path.replace(/^\/+/, '')}`))
}