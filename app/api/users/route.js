import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

// GET /api/users
export async function GET() {
  try {
    await connectDB();

    const users = await User.find();

    return Response.json(users);
  } catch (error) {
    return Response.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/users
export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const user = await User.create(body);

    return Response.json(user, { status: 201 });
  } catch (error) {
    return Response.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const { id } = params;

    await User.findByIdAndDelete(id);

    return Response.json({ message: "User deleted" });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
}