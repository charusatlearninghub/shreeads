import { motion, AnimatePresence } from 'framer-motion';
import { Award, PartyPopper, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface CourseCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseName: string;
  courseId: string;
}

const CourseCompletionModal = ({ isOpen, onClose, courseName, courseId }: CourseCompletionModalProps) => {
  const navigate = useNavigate();

  const handleDownloadCertificate = () => {
    onClose();
    navigate('/dashboard/certificates');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Confetti Background */}
              <div className="relative bg-gradient-to-br from-primary via-purple-600 to-pink-500 p-8 text-center overflow-hidden">
                {/* Decorative elements */}
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"
                />
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full"
                />
                
                {/* Sparkles */}
                <motion.div
                  animate={{ 
                    y: [-10, 10, -10],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-4 left-8"
                >
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                </motion.div>
                <motion.div
                  animate={{ 
                    y: [10, -10, 10],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="absolute top-6 right-12"
                >
                  <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                </motion.div>
                <motion.div
                  animate={{ 
                    y: [-5, 15, -5],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute bottom-8 right-6"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </motion.div>

                {/* Trophy/Award Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="relative z-10 w-24 h-24 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Award className="w-12 h-12 text-white" />
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative z-10"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <PartyPopper className="w-6 h-6 text-yellow-300" />
                    <h2 className="text-2xl font-display font-bold text-white">
                      Congratulations!
                    </h2>
                    <PartyPopper className="w-6 h-6 text-yellow-300 scale-x-[-1]" />
                  </div>
                  <p className="text-white/90 text-sm">
                    You've successfully completed
                  </p>
                </motion.div>
              </div>

              {/* Content */}
              <div className="p-6 text-center">
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl font-display font-bold mb-2"
                >
                  {courseName}
                </motion.h3>
                
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-muted-foreground mb-6"
                >
                  You've watched all the lessons. Your certificate is ready to download!
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Continue Learning
                  </Button>
                  <Button
                    onClick={handleDownloadCertificate}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Get Certificate
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CourseCompletionModal;
