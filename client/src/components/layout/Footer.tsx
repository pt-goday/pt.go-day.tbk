import { motion } from "framer-motion";

export default function Footer() {
  return (
    <motion.footer 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="mt-12 text-center text-gray-500 text-xs"
    >
      <p>© 2025 by DICO ERPIL PRANATAYUDA</p>
    </motion.footer>
  );
}
