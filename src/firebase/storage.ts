import { deleteObject, getDownloadURL, ref as fireRef, uploadBytes, uploadBytesResumable, type UploadMetadata } from 'firebase/storage'
import type { Ref } from 'vue'
import { storage } from './init'

export interface FirebaseStorageUploadResult {
    fullPath: string
    downloadURL: string
}

export const uploadFirebaseStorageFile = async (
    path: string,
    file: Blob | Uint8Array | ArrayBuffer,
    metadata?: UploadMetadata,
): Promise<FirebaseStorageUploadResult> => {
    const fileRef = fireRef(storage, path)
    const snapshot = await uploadBytes(fileRef, file, metadata)
    return {
        fullPath: snapshot.ref.fullPath,
        downloadURL: await getDownloadURL(snapshot.ref),
    }
}

export const uploadFirebaseStorage = () => {
    const percentage = ref(0)
    const downloadURL = ref('')
    const loading = ref(false)
    const error = ref<Error | null>(null)

    const upload = async (path: string, file: Ref<File>) => {
        const storageRef = fireRef(storage, path)
        loading.value = true
        error.value = null
        const uploadTask = uploadBytesResumable(storageRef, file.value)

        uploadTask.on('state_changed', (snapshot) => {
            percentage.value = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        }, (uploadError) => {
            loading.value = false
            error.value = uploadError
        }, () => {
            getDownloadURL(uploadTask.snapshot.ref).then((url) => {
                loading.value = false
                downloadURL.value = url
            }).catch((downloadError) => {
                loading.value = false
                error.value = downloadError
            })
        })
    }

    return { percentage, upload, downloadURL, loading, error }
}

export const uploadFirebasetorage = uploadFirebaseStorage

export const deleteStorageFileByPath = async (path: string): Promise<void> => {
    await deleteObject(fireRef(storage, path))
}

export const deleteStorageFileByURL = () => {
    const loading = ref(false)
    const error = ref<Error | null>(null)

    const deleteFile = async (url: string) => {
        loading.value = true
        error.value = null
        try {
            await deleteObject(fireRef(storage, url))
        } catch (deleteError) {
            error.value = deleteError instanceof Error ? deleteError : new Error('Could not delete storage file.')
        } finally {
            loading.value = false
        }
    }

    return { deleteFile, loading, error }
}