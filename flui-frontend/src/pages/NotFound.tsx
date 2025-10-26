import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="text-center space-y-6 px-4">
          <div className="space-y-4">
            <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              404
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
              Página não encontrada
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              A página que você está procurando não existe ou foi movida.
            </p>
          </div>
          
          <Button 
            size="lg" 
            className="gap-2"
            onClick={() => navigate('/')}
          >
            <Home className="w-4 h-4" />
            Voltar para Home
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotFound;
