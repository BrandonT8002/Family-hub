import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateFamily } from "@/hooks/use-family";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowRight,
  ArrowLeft,
  Heart,
  Calendar,
  Target,
  Wallet,
  ShoppingCart,
  Shield,
  Sparkles,
  Check,
} from "lucide-react";

const THEME_PRESETS = [
  {
    name: "Soft Cloud",
    description: "Whisper-light tints",
    colors: {
      home: "#f0f4f8", schedule: "#f3f0f8", money: "#f8f0f0",
      groceries: "#f5f3ee", chat: "#eef5f2", diary: "#f7f3ee",
      goals: "#eef4f0", wishlists: "#f6f0f4", leaveTime: "#f0f5f2"
    }
  },
  {
    name: "Warm Sand",
    description: "Cozy earth tones",
    colors: {
      home: "#f5f0e8", schedule: "#f0ebe3", money: "#f3ece4",
      groceries: "#efe8de", chat: "#eee9e0", diary: "#f2ebe1",
      goals: "#edeae2", wishlists: "#f4ede5", leaveTime: "#f0ebe3"
    }
  },
  {
    name: "Ocean Mist",
    description: "Cool, calm waters",
    colors: {
      home: "#edf2f7", schedule: "#e8eef6", money: "#eef0f5",
      groceries: "#e9eff5", chat: "#e6eef4", diary: "#eef1f6",
      goals: "#e8eff3", wishlists: "#edf0f6", leaveTime: "#e9f0f4"
    }
  },
  {
    name: "Lavender Dusk",
    description: "Soft twilight hues",
    colors: {
      home: "#f2eff8", schedule: "#eeeaf6", money: "#f4eef3",
      groceries: "#f0ecf2", chat: "#ede9f3", diary: "#f3eff5",
      goals: "#eeeaf2", wishlists: "#f5eff6", leaveTime: "#efedf4"
    }
  },
  {
    name: "Forest Morning",
    description: "Fresh, natural greens",
    colors: {
      home: "#eef4f0", schedule: "#ecf2ee", money: "#f2f0ec",
      groceries: "#eaf2ec", chat: "#e8f0eb", diary: "#f0eee8",
      goals: "#e9f1eb", wishlists: "#f0ede9", leaveTime: "#eaf2ed"
    }
  },
  {
    name: "Monochrome",
    description: "Clean and minimal",
    colors: {
      home: "#f8f9fa", schedule: "#f3f4f6", money: "#f1f2f4",
      groceries: "#eef0f2", chat: "#f0f1f3", diary: "#f2f3f5",
      goals: "#eff0f2", wishlists: "#f1f2f4", leaveTime: "#f3f4f6"
    }
  },
  {
    name: "Deep Night",
    description: "Dark and refined",
    colors: {
      home: "#1a1d23", schedule: "#1e2128", money: "#21242b",
      groceries: "#1d2027", chat: "#1b1f25", diary: "#201f24",
      goals: "#1c2122", wishlists: "#211e24", leaveTime: "#1b2120"
    }
  },
];

const FONTS = [
  { name: "Bricolage Grotesque", value: "'Bricolage Grotesque', sans-serif", sample: "Aa" },
  { name: "Plus Jakarta Sans", value: "'Plus Jakarta Sans', sans-serif", sample: "Aa" },
  { name: "Inter", value: "'Inter', sans-serif", sample: "Aa" },
  { name: "Poppins", value: "'Poppins', sans-serif", sample: "Aa" },
  { name: "Outfit", value: "'Outfit', sans-serif", sample: "Aa" },
  { name: "Montserrat", value: "'Montserrat', sans-serif", sample: "Aa" },
];

const TUTORIAL_SLIDES = [
  {
    icon: Calendar,
    title: "Schedule",
    description: "Organize personal and shared events. Never miss a practice or appointment.",
    color: "#8b9cf7",
  },
  {
    icon: Target,
    title: "Goals",
    description: "Track what matters most. Build habits and celebrate progress together.",
    color: "#7bc47f",
  },
  {
    icon: Wallet,
    title: "Money",
    description: "Understand where your money goes. Track bills, expenses, and savings.",
    color: "#f7a072",
  },
  {
    icon: ShoppingCart,
    title: "Shopping",
    description: "Stay organized in every store. Shared lists, categorized items.",
    color: "#e8a87c",
  },
  {
    icon: Shield,
    title: "Privacy",
    description: "Private by default. Shared by choice. Your family, your rules.",
    color: "#9b8ec4",
  },
];

const NEUTRAL_THEME = {
  name: "No theme",
  description: "Clean, neutral look",
  colors: {
    home: "#f8f9fa", schedule: "#f8f9fa", money: "#f8f9fa",
    groceries: "#f8f9fa", chat: "#f8f9fa", diary: "#f8f9fa",
    goals: "#f8f9fa", wishlists: "#f8f9fa", leaveTime: "#f8f9fa"
  }
};

const TOTAL_STEPS = 5;

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [familyName, setFamilyName] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<typeof THEME_PRESETS[0]>(NEUTRAL_THEME);
  const [selectedFont, setSelectedFont] = useState(FONTS[0].value);
  const [tutorialSlide, setTutorialSlide] = useState(0);
  const createFamily = useCreateFamily();
  const { user } = useAuth();

  const firstName = user?.firstName || "there";

  const handleComplete = () => {
    if (!familyName.trim()) return;
    createFamily.mutate({
      name: familyName,
      themeConfig: selectedTheme.colors,
      fontFamily: selectedFont,
    });
  };

  const canProceed = () => {
    if (step === 1) return familyName.trim().length > 0;
    return true;
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
  };

  const [direction, setDirection] = useState(1);

  const goNext = () => {
    if (step === TOTAL_STEPS - 1) {
      handleComplete();
      return;
    }
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      {step > 0 && step < TOTAL_STEPS - 1 && (
        <div className="px-6 pt-6 flex items-center gap-3">
          <button onClick={goBack} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" data-testid="button-onboarding-back">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-all duration-500 ${
                  i <= step ? "bg-primary" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <div className="w-9" />
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-lg"
          >
            {step === 0 && (
              <div className="text-center space-y-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto"
                >
                  <Heart className="w-10 h-10 text-primary" />
                </motion.div>

                <div className="space-y-3">
                  <h1 className="text-4xl font-display font-black tracking-tight text-gray-900" data-testid="text-welcome-title">
                    Welcome to FamilyHub.
                  </h1>
                  <p className="text-lg text-gray-500 font-medium leading-relaxed max-w-sm mx-auto">
                    Let's build your household. It only takes a minute.
                  </p>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={goNext}
                    className="h-14 px-10 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
                    data-testid="button-get-started"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>

                <p className="text-sm text-gray-400 font-medium">
                  You'll be the owner of this household.
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-8">
                <div className="text-center space-y-3">
                  <h2 className="text-3xl font-display font-black tracking-tight text-gray-900" data-testid="text-name-step">
                    Name your household
                  </h2>
                  <p className="text-gray-500 font-medium">
                    This is what your family will see at the top of the app.
                  </p>
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder="e.g. The Smiths, Our Home, Casa Johnson..."
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="h-16 px-5 rounded-2xl bg-white border-2 border-gray-100 focus:border-primary/30 text-xl font-bold text-center"
                    autoFocus
                    data-testid="input-family-name"
                  />
                </div>

                <Button
                  onClick={goNext}
                  disabled={!canProceed()}
                  className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
                  data-testid="button-next-name"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center space-y-3">
                  <h2 className="text-3xl font-display font-black tracking-tight text-gray-900" data-testid="text-theme-step">
                    Choose your look
                  </h2>
                  <p className="text-gray-500 font-medium">
                    Pick a color palette that feels like home. You can always change it later.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {THEME_PRESETS.map((preset) => {
                    const isSelected = selectedTheme?.name === preset.name;
                    const isDark = preset.name === "Deep Night";
                    return (
                      <button
                        key={preset.name}
                        onClick={() => setSelectedTheme(preset)}
                        className={`relative p-4 rounded-2xl border-2 transition-all text-left ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                            : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                        }`}
                        data-testid={`button-theme-${preset.name.toLowerCase().replace(/\s/g, "-")}`}
                      >
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="flex gap-1 mb-3">
                          {Object.values(preset.colors).slice(0, 5).map((c, i) => (
                            <div
                              key={i}
                              className={`w-5 h-5 rounded-lg ${isDark ? "border border-gray-600" : "border border-white shadow-sm"}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <p className="text-sm font-black text-gray-800">{preset.name}</p>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">{preset.description}</p>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setSelectedTheme(NEUTRAL_THEME)}
                    className={`relative p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedTheme.name === "No theme"
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                        : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                    }`}
                    data-testid="button-theme-none"
                  >
                    {selectedTheme.name === "No theme" && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="flex gap-1 mb-3">
                      {[1,2,3,4,5].map((i) => (
                        <div key={i} className="w-5 h-5 rounded-lg bg-gray-50 border border-gray-200" />
                      ))}
                    </div>
                    <p className="text-sm font-black text-gray-800">No theme</p>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">Clean, neutral look</p>
                  </button>
                </div>

                <Button
                  onClick={goNext}
                  className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
                  data-testid="button-next-theme"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center space-y-3">
                  <h2 className="text-3xl font-display font-black tracking-tight text-gray-900" data-testid="text-font-step">
                    Pick your typeface
                  </h2>
                  <p className="text-gray-500 font-medium">
                    The personality behind every word.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {FONTS.map((font) => {
                    const isSelected = selectedFont === font.value;
                    return (
                      <button
                        key={font.name}
                        onClick={() => setSelectedFont(font.value)}
                        className={`p-4 rounded-2xl border-2 transition-all text-left ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                            : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                        }`}
                        data-testid={`button-font-${font.name.toLowerCase().replace(/\s/g, "-")}`}
                      >
                        <p
                          className="text-2xl font-bold text-gray-800 mb-1"
                          style={{ fontFamily: font.value }}
                        >
                          {font.sample}
                        </p>
                        <p className="text-xs font-bold text-gray-500">{font.name}</p>
                      </button>
                    );
                  })}
                </div>

                <Button
                  onClick={goNext}
                  className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
                  data-testid="button-next-font"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8">
                <AnimatePresence mode="wait">
                  {tutorialSlide < TUTORIAL_SLIDES.length ? (
                    <motion.div
                      key={tutorialSlide}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="text-center space-y-6"
                    >
                      <div
                        className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
                        style={{ backgroundColor: TUTORIAL_SLIDES[tutorialSlide].color + "20" }}
                      >
                        {(() => {
                          const Icon = TUTORIAL_SLIDES[tutorialSlide].icon;
                          return <Icon className="w-10 h-10" style={{ color: TUTORIAL_SLIDES[tutorialSlide].color }} />;
                        })()}
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-3xl font-display font-black tracking-tight text-gray-900">
                          {TUTORIAL_SLIDES[tutorialSlide].title}
                        </h2>
                        <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-sm mx-auto">
                          {TUTORIAL_SLIDES[tutorialSlide].description}
                        </p>
                      </div>

                      <div className="flex justify-center gap-2 pt-2">
                        {TUTORIAL_SLIDES.map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all ${
                              i === tutorialSlide ? "bg-primary w-6" : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>

                      <Button
                        onClick={() => setTutorialSlide((s) => s + 1)}
                        variant="ghost"
                        className="h-12 px-8 rounded-2xl text-base font-bold"
                        data-testid="button-tutorial-next"
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center space-y-6"
                    >
                      <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto">
                        <Sparkles className="w-10 h-10 text-primary" />
                      </div>

                      <div className="space-y-3">
                        <h2 className="text-3xl font-display font-black tracking-tight text-gray-900" data-testid="text-ready">
                          You're all set, {firstName}.
                        </h2>
                        <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-sm mx-auto">
                          Let's build something strong.
                        </p>
                      </div>

                      <Button
                        onClick={handleComplete}
                        disabled={createFamily.isPending}
                        className="h-14 px-10 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
                        data-testid="button-enter-app"
                      >
                        {createFamily.isPending ? "Creating..." : "Enter FamilyHub"}
                        {!createFamily.isPending && <ArrowRight className="w-5 h-5 ml-2" />}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
