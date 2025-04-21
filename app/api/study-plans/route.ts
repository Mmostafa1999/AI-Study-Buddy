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
      // Try serverAuth first
      try {
        const decodedToken = await serverAuth.verifyIdToken(token);
        uid = decodedToken.uid;
      } catch (serverAuthError) {
       

        // Fallback to client-side auth if there's a currentUser
        if (auth.currentUser) {
          uid = auth.currentUser.uid;
        } else {
          // Use a direct API call to verify token
          try {
            const response = await fetch(
              `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken: token }),
              }
            );
            
            if (!response.ok) {
              throw new Error(`Token verification failed: ${response.status}`);
            }
            
            const data = await response.json();
            if (!data.users || data.users.length === 0) {
              throw new Error("No user found for token");
            }
            
            uid = data.users[0].localId;
          } catch (directApiError) {
            throw directApiError;
          }
        }
      }

      if (!uid) {
        throw new Error("Failed to verify token or get user ID");
      }
    } catch (error) {
      console.error("[DEBUG] Error verifying token:", error);
      return NextResponse.json(
        { error: "Unauthorized: Invalid token or no authenticated user" },
        { status: 401 },
      );
    }

    // Get request body and process it
    const body = await req.json();

    // Validation
    if (!body.userId || body.userId !== uid) {
      body.userId = uid; // Set the correct userId
    }

    // Get request body
    const { studyPlan, subjects, examDate, hoursPerDay } = body;


    // Validate inputs
    if (!studyPlan || !studyPlan.days || !Array.isArray(studyPlan.days)) {
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


    try {
      const docRef = await addDoc(collection(db, "studyPlans"), studyPlanData);

      return NextResponse.json({
        data: {
          id: docRef.id
        },
        success: true,
        message: "Study plan saved successfully"
      });
    } catch (firestoreError) {
      console.error("[DEBUG] Firestore error:", firestoreError);
      // Return the error instead of throwing to prevent unhandled rejections
      return NextResponse.json(
        {
          error: "Failed to save study plan to Firestore",
          details: firestoreError instanceof Error ? firestoreError.message : String(firestoreError),
        },
        { status: 500 },
      );
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
