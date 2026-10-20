import { LandingHeader } from "@/components/landing/Header";
import { LandingHero } from "@/components/landing/Hero";
import { FeatureSection } from "@/components/landing/Feature";
import { HowItWorks } from "@/components/landing/Carakerja";
import { RolesSection } from "@/components/landing/Roles";
import { LandingCta } from "@/components/landing/Cta";
import { LoadingScreen } from "@/components/landing/LoadingScreen";

export default function Home() {
 return <main className="landing-page"><LoadingScreen/><LandingHeader/><LandingHero/><FeatureSection/><HowItWorks/><RolesSection/><LandingCta/></main>;
}
