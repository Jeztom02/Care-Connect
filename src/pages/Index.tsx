import { Navigate } from "react-router-dom";

// This component now redirects to the Landing page
const Index = () => {
  return <Navigate to="/" replace />;
};

export default Index;
