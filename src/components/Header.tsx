import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonPath?: string;
}

const Header = ({ 
  title, 
  subtitle, 
  showBackButton = false, 
  backButtonText = "Back", 
  backButtonPath = "/home" 
}: HeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(backButtonPath)}
            className="flex items-center gap-2"
          >
            {backButtonText}
          </Button>
        )}
        {title && (
          <div>
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <img 
          src="/lovable-uploads/16b7eb00-ca19-4bc1-96c7-0ea3abc83cb2.png" 
          alt="Grog One Logo" 
          className="h-12 w-auto"
        />
        {user ? (
          <>
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
            <Button onClick={signOut} variant="outline" size="sm">
              Sign Out
            </Button>
          </>
        ) : (
          <Button onClick={() => navigate('/auth')} variant="outline" size="sm">
            Sign In
          </Button>
        )}
      </div>
    </div>
  );
};

export default Header;