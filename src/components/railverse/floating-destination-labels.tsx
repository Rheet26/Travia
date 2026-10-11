import { motion } from "motion/react";
import { MapPin } from "lucide-react";

export interface DestinationLabel {
  id: string;
  name: string;
  stationCode: string;
  // Percentage positions relative to hero section
  top: string;
  left?: string;
  right?: string;
  duration: number;
  delay: number;
  mobileVisible?: boolean;
}

const DESTINATIONS: DestinationLabel[] = [
  {
    id: "delhi",
    name: "Delhi",
    stationCode: "NDLS",
    top: "12%",
    left: "12%",
    duration: 5.2,
    delay: 0.2,
    mobileVisible: true,
  },
  {
    id: "mumbai",
    name: "Mumbai",
    stationCode: "MMCT",
    top: "14%",
    right: "14%",
    duration: 4.8,
    delay: 0.6,
    mobileVisible: true,
  },
  {
    id: "varanasi",
    name: "Varanasi",
    stationCode: "BSB",
    top: "28%",
    left: "6%",
    duration: 6.1,
    delay: 0.4,
    mobileVisible: true,
  },
  {
    id: "bihar",
    name: "Bihar",
    stationCode: "PNBE",
    top: "27%",
    right: "6%",
    duration: 5.5,
    delay: 0.8,
    mobileVisible: false,
  },
  {
    id: "goa",
    name: "Goa",
    stationCode: "MAO",
    top: "52%",
    left: "4%",
    duration: 4.5,
    delay: 1.1,
    mobileVisible: false,
  },
  {
    id: "jaipur",
    name: "Jaipur",
    stationCode: "JP",
    top: "50%",
    right: "4%",
    duration: 5.8,
    delay: 0.3,
    mobileVisible: false,
  },
  {
    id: "chandigarh",
    name: "Chandigarh",
    stationCode: "CDG",
    top: "67%",
    left: "20%",
    duration: 4.2,
    delay: 1.4,
    mobileVisible: false,
  },
  {
    id: "kerala",
    name: "Kerala",
    stationCode: "TVC",
    top: "72%",
    left: "5%",
    duration: 5.9,
    delay: 0.9,
    mobileVisible: true,
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    stationCode: "SC",
    top: "74%",
    right: "12%",
    duration: 4.7,
    delay: 0.5,
    mobileVisible: true,
  },
  {
    id: "bengaluru",
    name: "Bengaluru",
    stationCode: "SBC",
    top: "82%",
    left: "28%",
    duration: 5.0,
    delay: 1.2,
    mobileVisible: true,
  },
  {
    id: "kolkata",
    name: "Kolkata",
    stationCode: "HWH",
    top: "80%",
    right: "26%",
    duration: 6.3,
    delay: 0.7,
    mobileVisible: true,
  },
  {
    id: "chennai",
    name: "Chennai",
    stationCode: "MAS",
    top: "38%",
    right: "18%",
    duration: 5.4,
    delay: 1.0,
    mobileVisible: false,
  },
];

export function FloatingDestinationLabels({
  onSelectDestination,
}: {
  onSelectDestination: (city: string) => void;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {DESTINATIONS.map((item) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{
            opacity: [0.85, 1, 0.85],
            y: [0, -10, 0],
            x: [0, 4, 0],
            scale: 1,
          }}
          transition={{
            opacity: {
              duration: item.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: item.delay,
            },
            y: { duration: item.duration, repeat: Infinity, ease: "easeInOut", delay: item.delay },
            x: {
              duration: item.duration * 1.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: item.delay,
            },
            scale: { duration: 0.3 },
          }}
          style={{
            top: item.top,
            left: item.left,
            right: item.right,
          }}
          className={`absolute pointer-events-auto ${
            item.mobileVisible ? "flex" : "hidden md:flex"
          }`}
        >
          <button
            type="button"
            onClick={() => onSelectDestination(`${item.name} (${item.stationCode})`)}
            className="group flex items-center gap-2.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[#4cd7f6]/60 bg-[#0f1417]/85 backdrop-blur-xl shadow-[0_0_16px_rgba(76,215,246,0.35)] hover:border-[#4cd7f6] hover:bg-[#4cd7f6]/25 hover:shadow-[0_0_25px_rgba(76,215,246,0.85)] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full bg-[#4cd7f6]/20 text-[#4cd7f6] group-hover:bg-[#4cd7f6] group-hover:text-[#0f1417] flex items-center justify-center transition-colors">
              <MapPin className="size-3.5" />
            </div>
            <span className="font-sans text-xs sm:text-sm font-extrabold text-white tracking-wide drop-shadow-[0_0_8px_rgba(76,215,246,0.7)] group-hover:text-[#4cd7f6] transition-colors">
              {item.name}
            </span>
          </button>
        </motion.div>
      ))}
    </div>
  );
}
