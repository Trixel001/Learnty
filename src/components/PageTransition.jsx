import { motion } from 'framer-motion';

const PageTransition = ({ children }) => {
    return (
        <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-full h-full absolute top-0 left-0"
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
