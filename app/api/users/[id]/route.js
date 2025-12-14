import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

export async function DELETE(req, context) {
  try {
    await connectDB();

    const { id } = await context.params;

    // اعتبارسنجی id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        { message: "Invalid user ID" },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return Response.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return Response.json({ message: "User deleted" });
  } catch (error) {
    console.error(error);
    return Response.json({ message: error.message }, { status: 500 });
  }
}
