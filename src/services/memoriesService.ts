import firestore, {FirebaseFirestoreTypes} from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";

// services
import authService from "./authService";

// utils
import getImageBlob from "../utils/getImageBlob";

// types
import Memory from "../types/Memory";
import {MemoryData} from "../types/UserInput";

class MemoriesService {
  async getMemories(last?: FirebaseFirestoreTypes.QueryDocumentSnapshot<Memory>): Promise<FirebaseFirestoreTypes.QueryDocumentSnapshot<Memory>[]> {
    if (last) {
      const response = await firestore()
        .collection<Memory>('Memories')
        .orderBy('dateCode', 'desc')
        .startAfter(last)
        .limit(10)
        .get();

      return response.docs;
    }

    const response = await firestore()
      .collection<Memory>('Memories')
      .limit(10)
      .orderBy('dateCode', 'desc')
      .get();

    return response.docs;
  }

  async getMemory(id: string): Promise<Memory | undefined> {
    const response = await firestore()
      .collection<Memory>('Memories')
      .doc(id)
      .get();

    return response.data();
  }

  async createMemory(memory: MemoryData): Promise<Memory> {
    const uid = authService.uid;

    const reference = await firestore()
      .collection('Memories')
      .doc();

    const id = reference.id;

    // setting image of memory to storage
    const storageReference = storage().ref(`memories/${id}`);

    const blob = await getImageBlob(memory.img?.uri as string);

    await storageReference.put(blob);

    const img = await storageReference.getDownloadURL();

    // setting memory to db
    const newMemory = {
      ...memory,
      img,
      uid,
      date: new Date().toISOString(),
      dateCode: Date.now(),
    };

    await reference.set(newMemory);

    return { ...newMemory, id };
  }

  async deleteMemory(id: string): Promise<void> {
    await firestore()
      .collection('Memories')
      .doc(id)
      .delete();
  }
}

export default new MemoriesService();
