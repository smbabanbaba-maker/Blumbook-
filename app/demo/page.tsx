import BlumbookApp from "@/components/BlumbookApp";

export const metadata={
  title:"Blumbook — Demo Showroom",
  description:"Fictional demo posts and replies for interface testing only.",
  robots:{index:false,follow:false},
};

export default function DemoPage(){
  return <BlumbookApp forceDemo/>;
}
