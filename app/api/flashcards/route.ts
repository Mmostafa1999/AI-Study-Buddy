import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "../../lib/firebase";

// GET: Get user's flashcards
export async function GET(req: NextRequest) {
  try {
    // Get the ID token from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify and get user from token
    let userId: string;
    try {
      const decodedToken = await auth.currentUser?.getIdToken();
      if (!decodedToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = auth.currentUser?.uid || "";
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get subject from query params (optional)
    const url = new URL(req.url);
    const subject = url.searchParams.get("subject");

    // Query flashcards collection
    let flashcardsQuery = query(
      collection(db, "flashcards"),
      where("userId", "==", userId),
    );

    if (subject) {
      flashcardsQuery = query(
        collection(db, "flashcards"),
        where("userId", "==", userId),
        where("subject", "==", subject),
      );
    }

    const snapshot = await getDocs(flashcardsQuery);
    const flashcards = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ flashcards });
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST: Create new flashcards
export async function POST(req: NextRequest) {
  try {
    // Get the ID token from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify and get user from token
    let userId: string;
    try {
      const decodedToken = await auth.currentUser?.getIdToken();
      if (!decodedToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = auth.currentUser?.uid || "";
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { flashcards, subject } = await req.json();

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      return NextResponse.json(
        { error: "Valid flashcards are required" },
        { status: 400 },
      );
    }

    if (!subject) {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 },
      );
    }

    // Save flashcards to Firestore
    const savedFlashcards = [];
    for (const flashcard of flashcards) {
      const { question, answer } = flashcard;
      if (!question || !answer) {
        continue; // Skip invalid flashcards
      }

      const docRef = await addDoc(collection(db, "flashcards"), {
        userId,
        subject,
        question,
        answer,
        createdAt: serverTimestamp(),
      });

      savedFlashcards.push({
        id: docRef.id,
        question,
        answer,
        subject,
      });
    }

    return NextResponse.json({
      message: `${savedFlashcards.length} flashcards saved successfully`,
      flashcards: savedFlashcards,
    });
  } catch (error) {
    console.error("Error saving flashcards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE: Delete a flashcard
export async function DELETE(req: NextRequest) {
  try {
    // Get the ID token from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify and get user from token
    let userId: string;
    try {
      const decodedToken = await auth.currentUser?.getIdToken();
      if (!decodedToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = auth.currentUser?.uid || "";
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Flashcard ID is required" },
        { status: 400 },
      );
    }

    // Delete the flashcard
    await deleteDoc(doc(db, "flashcards", id));

    return NextResponse.json({ message: "Flashcard deleted successfully" });
  } catch (error) {
    console.error("Error deleting flashcard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT: Update a flashcard
export async function PUT(req: NextRequest) {
  try {
    // Get the ID token from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify and get user from token
    let userId: string;
    try {
      const decodedToken = await auth.currentUser?.getIdToken();
      if (!decodedToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = auth.currentUser?.uid || "";
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id, question, answer } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Flashcard ID is required" },
        { status: 400 },
      );
    }

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question and answer are required" },
        { status: 400 },
      );
    }

    // Update the flashcard
    await updateDoc(doc(db, "flashcards", id), {
      question,
      answer,
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      message: "Flashcard updated successfully",
      flashcard: { id, question, answer },
    });
  } catch (error) {
    console.error("Error updating flashcard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
