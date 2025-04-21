"use client";

import { db } from "@/app/lib/firebase";
import {
  addDoc,
  collection,
  CollectionReference,
  deleteDoc,
  doc,
  DocumentData,
  DocumentReference,
  FirestoreError,
  getDoc,
  getDocs,
  limit,
  orderBy,
  OrderByDirection,
  query,
  QueryConstraint,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  WhereFilterOp,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";

type FirestoreTimestamp = {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

// Convert Firestore Timestamps to dates
export const convertTimestamps = <T extends DocumentData>(data: T): T => {
  if (!data) return data;

  const result = { ...data } as Record<string, any>;

  Object.keys(result).forEach(key => {
    const value = result[key];

    // Check if the value is a Firestore Timestamp
    if (value instanceof Timestamp) {
      result[key] = value.toDate();
    }
    // Check if the value is an object (to handle nested objects)
    else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      result[key] = convertTimestamps(value);
    }
    // Check if the value is an array (to handle arrays of objects)
    else if (Array.isArray(value)) {
      result[key] = value.map(item =>
        typeof item === "object" && item !== null
          ? convertTimestamps(item)
          : item,
      );
    }
  });

  return result as T;
};

// Define types for the hook
interface FirestoreHookOptions<T> {
  collectionName: string;
  idField?: keyof T;
  userField?: string;
  limit?: number;
  orderByField?: keyof T;
  orderDirection?: OrderByDirection;
  where?: Array<[string, WhereFilterOp, any]>;
  transformData?: (data: DocumentData) => T;
}

interface FirestoreState<T> {
  data: T[];
  loading: boolean;
  error: FirestoreError | null;
}

/**
 * A custom hook for interacting with Firestore collections
 */
export function useFirestore<T extends { id: string }>(
  options: FirestoreHookOptions<T>,
): {
  data: T[];
  loading: boolean;
  error: FirestoreError | null;
  fetchById: (id: string) => Promise<T | null>;
  add: (data: Omit<T, "id">) => Promise<string>;
  update: (id: string, data: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
} {
  const {
    collectionName,
    idField = "id" as keyof T,
    userField,
    limit: queryLimit,
    orderByField,
    orderDirection = "desc",
    where: whereConditions,
    transformData = data => data as unknown as T,
  } = options;

  const [state, setState] = useState<FirestoreState<T>>({
    data: [],
    loading: true,
    error: null,
  });

  const { user } = useAuth();
  const userId = user?.uid;

  // Create a reference to the Firestore collection
  const collectionRef = collection(
    db,
    collectionName,
  ) as CollectionReference<DocumentData>;

  // Function to fetch data from Firestore
  const fetchData = useCallback(async () => {
    if (userField && !userId) {
      setState({
        data: [],
        loading: false,
        error: null,
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const constraints: QueryConstraint[] = [];

      // Add user constraint if userField is provided
      if (userField && userId) {
        constraints.push(where(userField, "==", userId));
      }

      // Add any custom where conditions
      if (whereConditions) {
        whereConditions.forEach(([field, op, value]) => {
          constraints.push(where(field, op, value));
        });
      }

      // Add ordering
      if (orderByField) {
        constraints.push(orderBy(orderByField as string, orderDirection));
      }

      // Add limit
      if (queryLimit) {
        constraints.push(limit(queryLimit));
      }

      const q = query(collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);

      const documents: T[] = [];

      querySnapshot.forEach(doc => {
        const data = doc.data();

        // Convert timestamps to dates
        const convertedData = convertTimestamps(data);

        // Add the document ID to the data
        const withId = {
          ...convertedData,
          [idField]: doc.id,
        };

        // Apply any data transformations
        documents.push(transformData(withId));
      });

      setState({
        data: documents,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as FirestoreError,
      }));
    }
  }, [
    collectionName,
    userId,
    userField,
    orderByField,
    orderDirection,
    queryLimit,
    whereConditions,
    idField,
    transformData,
    collectionRef,
  ]);

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch a single document by ID
  const fetchById = async (id: string): Promise<T | null> => {
    try {
      const docRef = doc(
        db,
        collectionName,
        id,
      ) as DocumentReference<DocumentData>;
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        return null;
      }

      const data = docSnapshot.data();

      // Convert timestamps to dates
      const convertedData = convertTimestamps(data);

      // Add the document ID to the data
      const withId = {
        ...convertedData,
        [idField]: docSnapshot.id,
      };

      // Apply any data transformations
      return transformData(withId);
    } catch (error) {
      console.error("Error fetching document by ID:", error);
      throw error;
    }
  };

  // Add a new document to the collection
  const add = async (data: Omit<T, "id">): Promise<string> => {
    try {
      // Add user ID if userField is specified
      const dataWithUser =
        userField && userId
          ? { ...data, [userField]: userId, createdAt: serverTimestamp() }
          : { ...data, createdAt: serverTimestamp() };

      const docRef = await addDoc(collectionRef, dataWithUser);

      // Refresh data
      fetchData();

      return docRef.id;
    } catch (error) {
      console.error("Error adding document:", error);
      throw error;
    }
  };

  // Update an existing document
  const update = async (id: string, data: Partial<T>): Promise<void> => {
    try {
      const docRef = doc(db, collectionName, id);

      // Add updatedAt timestamp
      const dataWithTimestamp = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, dataWithTimestamp);

      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
  };

  // Remove a document
  const remove = async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);

      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Error removing document:", error);
      throw error;
    }
  };

  return {
    ...state,
    fetchById,
    add,
    update,
    remove,
    refresh: fetchData,
  };
}
