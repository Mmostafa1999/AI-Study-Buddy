import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import { auth, db, serverAuth } from "../../lib/firebase";

// GET: Get user's study plans
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    let uid;

    try {
      // Try serverAuth first, fall back to regular auth if needed
      try {
        const decodedToken = await serverAuth.verifyIdToken(token);
        uid = decodedToken.uid;
      } catch (serverAuthError) {
        console.log("Server auth failed, trying client auth:", serverAuthError);

        // Fallback to client-side auth if there's a currentUser
        if (auth.currentUser) {
          uid = auth.currentUser.uid;
        } else {
          // Use serverAuth for token verification as fallback
          const decodedToken = await serverAuth.verifyIdToken(token);
          uid = decodedToken.uid;
        }
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 },
      );
    }

    // Check if a specific plan is requested
    const url = new URL(req.url);
    const planId = url.searchParams.get("planId");

    if (planId) {
      // Fetch a single study plan
      const docRef = doc(db, "studyPlans", planId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return NextResponse.json(
          { error: "Study plan not found" },
          { status: 404 },
        );
      }

      const planData = docSnap.data();

      // Verify that the plan belongs to the authenticated user
      if (planData.userId !== uid) {
        return NextResponse.json(
          { error: "Unauthorized: You don't have access to this study plan" },
          { status: 403 },
        );
      }

      return NextResponse.json({
        success: true,
        plan: {
          id: docSnap.id,
          ...planData,
        },
      });
    } else {
      // Fetch all study plans for the user
      const q = query(
        collection(db, "studyPlans"),
        where("userId", "==", uid),
        orderBy("createdAt", "desc"),
      );

      const querySnapshot = await getDocs(q);
      const plans = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return NextResponse.json({
        success: true,
        plans,
      });
    }
  } catch (error) {
    console.error("Error fetching study plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch study plans" },
      { status: 500 },
    );
  }
}

// POST: Save a new study plan
export async function POST(req: NextRequest) {
  try {
    console.log("[DEBUG] Starting POST request to /api/study-plans");

    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("[DEBUG] No Authorization header or invalid format");
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    console.log("[DEBUG] Token extracted from header, length:", token?.length);
    let uid;

    try {
      // Try serverAuth first, fall back to regular auth if needed
      try {
        console.log("[DEBUG] Attempting to verify token with serverAuth");
        const decodedToken = await serverAuth.verifyIdToken(token);
        uid = decodedToken.uid;
        console.log("[DEBUG] ServerAuth successful, UID:", uid);
      } catch (serverAuthError) {
        console.log(
          "[DEBUG] Server auth failed, trying client auth:",
          serverAuthError,
        );

        // Fallback to client-side auth if there's a currentUser
        if (auth.currentUser) {
          uid = auth.currentUser.uid;
        } else {
          // Use serverAuth for token verification as fallback
          const decodedToken = await serverAuth.verifyIdToken(token);
          uid = decodedToken.uid;
        }
      }

      if (!uid) {
        console.log("[DEBUG] Failed to get UID from any method");
        throw new Error("Failed to verify token or get user ID");
      }
    } catch (error) {
      console.error("[DEBUG] Error verifying token:", error);
      return NextResponse.json(
        { error: "Unauthorized: Invalid token or no authenticated user" },
        { status: 401 },
      );
    }

    // Get request body
    const body = await req.json();
    const { studyPlan, subjects, examDate, hoursPerDay } = body;

    console.log("[DEBUG] Creating study plan for user:", uid);
    console.log("[DEBUG] Study plan subjects count:", subjects?.length);
    console.log("[DEBUG] Study plan days count:", studyPlan?.days?.length);

    // Validate inputs
    if (!studyPlan || !studyPlan.days || !Array.isArray(studyPlan.days)) {
      console.log("[DEBUG] Invalid study plan data:", studyPlan);
      return NextResponse.json(
        { error: "Bad Request: Study plan is required" },
        { status: 400 },
      );
    }

    // Add study plan to the database
    const studyPlanData = {
      userId: uid,
      studyPlan,
      subjects,
      examDate,
      hoursPerDay,
      createdAt: new Date().toISOString(),
    };

    console.log("[DEBUG] Attempting to add to Firestore");

    try {
      const docRef = await addDoc(collection(db, "studyPlans"), studyPlanData);
      console.log("[DEBUG] Study plan saved with ID:", docRef.id);

      return NextResponse.json({
        success: true,
        message: "Study plan saved successfully",
        planId: docRef.id,
      });
    } catch (firestoreError) {
      console.error("[DEBUG] Firestore error:", firestoreError);
      throw firestoreError;
    }
  } catch (error) {
    console.error("[DEBUG] Error saving study plan:", error);
    return NextResponse.json(
      {
        error: "Failed to save study plan",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// DELETE: Delete a study plan
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
    let uid: string;
    try {
      // Try serverAuth first, fall back to regular auth if needed
      try {
        const decodedToken = await serverAuth.verifyIdToken(idToken);
        uid = decodedToken.uid;
      } catch (serverAuthError) {
        console.log("Server auth failed, trying client auth:", serverAuthError);

        // Fallback to client-side auth if there's a currentUser
        if (auth.currentUser) {
          uid = auth.currentUser.uid;
        } else {
          // Use serverAuth for token verification as fallback
          const decodedToken = await serverAuth.verifyIdToken(idToken);
          uid = decodedToken.uid;
        }
      }
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Study plan ID is required" },
        { status: 400 },
      );
    }

    // Get the study plan to verify ownership
    const docRef = doc(db, "studyPlans", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Study plan not found" },
        { status: 404 },
      );
    }

    const planData = docSnap.data();

    // Verify that the plan belongs to the authenticated user
    if (planData.userId !== uid) {
      return NextResponse.json(
        { error: "Unauthorized: You don't have access to this study plan" },
        { status: 403 },
      );
    }

    // Delete the study plan
    await deleteDoc(doc(db, "studyPlans", id));

    return NextResponse.json({
      success: true,
      message: "Study plan deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting study plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
