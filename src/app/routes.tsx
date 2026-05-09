import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { QuestionPage } from "./pages/QuestionPage";
import { SwipePage } from "./pages/SwipePage";
import { PetDetailsPage } from "./pages/PetDetailsPage";
import { MatchesPage } from "./pages/MatchesPage";
import { ProfilePage } from "./pages/ProfilePage";
import { OngDashboard } from "./pages/OngDashboard";
import { OngAnimalsPage } from "./pages/OngAnimalsPage";
import { OngAddPetPage } from "./pages/OngAddPetPage";
import { OngInterestsPage } from "./pages/OngInterestsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/questionario",
    Component: QuestionPage,
  },
  {
    path: "/swipe",
    Component: SwipePage,
  },
  {
    path: "/pet/:id",
    Component: PetDetailsPage,
  },
  {
    path: "/matches",
    Component: MatchesPage,
  },
  {
    path: "/perfil",
    Component: ProfilePage,
  },
  {
    path: "/ong",
    Component: OngDashboard,
  },
  {
    path: "/ong/animais",
    Component: OngAnimalsPage,
  },
  {
    path: "/ong/adicionar",
    Component: OngAddPetPage,
  },
  {
    path: "/ong/interessados",
    Component: OngInterestsPage,
  },
]);
