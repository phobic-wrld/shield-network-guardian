import User from "../models/user";

export const getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ plan: user.subscriptionPlan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
