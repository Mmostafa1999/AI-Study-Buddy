import { auth, db, serverAuth } from "@/app/lib/firebase";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch a specific study plan
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
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

        // Fallback to client-side auth
        if (auth.currentUser) {
          uid = auth.currentUser.uid;
        } else {
          // Use serverAuth for token verification
          try {
            const decodedToken = await serverAuth.verifyIdToken(token);
            uid = decodedToken.uid;
          } catch (error) {
            console.error("Final token verification failed:", error);
            throw error;
          }
        }
      }

      if (!uid) {
        throw new Error("Failed to verify token or get user ID");
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      return NextResponse.json(
        { error: "Unauthorized: Invalid token or no authenticated user" },
        { status: 401 },
      );
    }

    const planId = params.id;
    console.log("Fetching study plan:", planId, "for user:", uid);

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
  } catch (error) {
    console.error("Error fetching study plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch study plan" },
      { status: 500 },
    );
  }
}

// PUT - Update a specific study plan
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
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

        // Fallback to client-side auth
        if (auth.currentUser) {
          uid = auth.currentUser.uid;
        } else {
          // Use serverAuth for token verification
          try {
            const decodedToken = await serverAuth.verifyIdToken(token);
            uid = decodedToken.uid;
          } catch (error) {
            console.error("Final token verification failed:", error);
            throw error;
          }
        }
      }

      if (!uid) {
        throw new Error("Failed to verify token or get user ID");
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      return NextResponse.json(
        { error: "Unauthorized: Invalid token or no authenticated user" },
        { status: 401 },
      );
    }

    const planId = params.id;
    const body = await request.json();
    const { studyPlan, subjects, examDate, hoursPerDay } = body;

    // Validate inputs
    if (!studyPlan) {
      return NextResponse.json(
        { error: "Bad Request: Study plan is required" },
        { status: 400 },
      );
    }

    // Check if the study plan exists and belongs to the user
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

    // Update the study plan
    const updatedStudyPlan = {
      studyPlan,
      subjects,
      examDate,
      hoursPerDay,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(docRef, updatedStudyPlan);

    return NextResponse.json({
      success: true,
      message: "Study plan updated successfully",
    });
  } catch (error) {
    console.error("Error updating study plan:", error);
    return NextResponse.json(
      { error: "Failed to update study plan" },
      { status: 500 },
    );
  }
}

// DELETE - Delete a specific study plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
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

        // Fallback to client-side auth
        if (auth.currentUser) {
          uid = auth.currentUser.uid;
        } else {
          // Use serverAuth for token verification
          try {
            const decodedToken = await serverAuth.verifyIdToken(token);
            uid = decodedToken.uid;
          } catch (error) {
            console.error("Final token verification failed:", error);
            throw error;
          }
        }
      }

      if (!uid) {
        throw new Error("Failed to verify token or get user ID");
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      return NextResponse.json(
        { error: "Unauthorized: Invalid token or no authenticated user" },
        { status: 401 },
      );
    }

    const planId = params.id;
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

    // Delete the study plan
    await deleteDoc(docRef);

    return NextResponse.json({
      success: true,
      message: "Study plan deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting study plan:", error);
    return NextResponse.json(
      { error: "Failed to delete study plan" },
      { status: 500 },
    );
  }
}
