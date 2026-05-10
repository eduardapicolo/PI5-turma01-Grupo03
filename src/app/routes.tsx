import { createBrowserRouter } from "react-router";
import { HomePage }        from "./pages/HomePage";
import { LoginPage }       from "./pages/LoginPage";
import { QuestionPage }    from "./pages/QuestionPage";
import { SwipePage }       from "./pages/SwipePage";
import { PetDetailsPage }  from "./pages/PetDetailsPage";
import { MatchesPage }     from "./pages/MatchesPage";
import { ProfilePage }     from "./pages/ProfilePage";
import { OngDashboard }    from "./pages/OngDashboard";
import { OngAnimalsPage }  from "./pages/OngAnimalsPage";
import { OngAddPetPage }   from "./pages/OngAddPetPage";
import { OngInterestsPage } from "./pages/OngInterestsPage";
import { OngEditPetPage }  from "./pages/OngEditPetPage";
import { ProtectedRoute }  from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  { path: "/",      Component: HomePage  },
  { path: "/login", Component: LoginPage },

  // Rotas protegidas — adotante
  {
    path: "/questionario",
    element: <ProtectedRoute><QuestionPage /></ProtectedRoute>,
  },
  {
    path: "/matches",
    element: <ProtectedRoute><MatchesPage /></ProtectedRoute>,
  },
  {
    path: "/swipe",
    element: <ProtectedRoute><SwipePage /></ProtectedRoute>,
  },
  {
    path: "/pet/:id",
    element: <ProtectedRoute><PetDetailsPage /></ProtectedRoute>,
  },
  {
    path: "/perfil",
    element: <ProtectedRoute><ProfilePage /></ProtectedRoute>,
  },

  // Rotas protegidas — ONG
  {
    path: "/ong",
    element: <ProtectedRoute requireRole="ong"><OngDashboard /></ProtectedRoute>,
  },
  {
    path: "/ong/animais",
    element: <ProtectedRoute requireRole="ong"><OngAnimalsPage /></ProtectedRoute>,
  },
  {
    path: "/ong/adicionar",
    element: <ProtectedRoute requireRole="ong"><OngAddPetPage /></ProtectedRoute>,
  },
  {
    path: "/ong/editar/:id",
    element: <ProtectedRoute requireRole="ong"><OngEditPetPage /></ProtectedRoute>,
  },
  {
    path: "/ong/interessados",
    element: <ProtectedRoute requireRole="ong"><OngInterestsPage /></ProtectedRoute>,
  },
]);
