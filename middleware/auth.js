// middleware/auth.js
const jwt = require("jsonwebtoken");

exports.requireAuth = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      const hdr = req.headers.authorization || "";
      const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
      if (!token) return res.status(401).json({ error: "Missing token" });

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      // payload should contain { id, role } as you already do in login
      if (allowedRoles.length && !allowedRoles.includes(payload.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      req.user = { id: payload.id, role: payload.role };
      next();
    } catch (e) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
};
