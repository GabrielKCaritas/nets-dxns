import type { Route } from "./+types/home";
import { Transaction } from "../nets/transaction";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "NETS Donations" },
    {
      name: "description",
      content: "Testing app for NETS Donations for Caritas Singapore",
    },
  ];
}

export default function Home() {
  return <Transaction />;
}
