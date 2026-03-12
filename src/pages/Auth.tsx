import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Eye, EyeOff, ArrowLeft, Loader2, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { signInSchema, signUpSchema, type SignInFormData, type SignUpFormData } from '@/lib/validations/auth';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { getAuthErrorMessage } from '@/lib/auth-errors';

export default function Auth() {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Countdown timer for rate limiting
  useEffect(() => {
    if (rateLimitSeconds && rateLimitSeconds > 0) {
      const timer = setInterval(() => {
        setRateLimitSeconds((prev) => (prev && prev > 1 ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [rateLimitSeconds]);

  // Sign In Form
  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  // Sign Up Form
  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const handleSignIn = async (data: SignInFormData) => {
    const { error } = await signIn(data.email, data.password);

    if (!error) {
      navigate('/');
    } else {
      // Check for rate limiting
      const errorMsg = error.message?.toLowerCase() || '';
      if (errorMsg.includes('too many') || errorMsg.includes('rate limit')) {
        setRateLimitSeconds(60); // 60 second cooldown
      }

      signInForm.setError('root', {
        message: getAuthErrorMessage(error),
      });
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    const { error } = await signUp(data.email, data.password, data.username);

    if (!error) {
      setSignUpEmail(data.email);
      setShowEmailVerification(true);
      signUpForm.reset();
    } else {
      signUpForm.setError('root', {
        message: getAuthErrorMessage(error),
      });
    }
  };

  const password = signUpForm.watch('password', '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-civic-green/10 via-background to-civic-blue/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to ama
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-civic-green to-civic-blue bg-clip-text text-transparent">
            ama
          </h1>
          <p className="text-muted-foreground">
            Empowering Kenyan civic engagement
          </p>
        </div>

        {/* Email Verification Alert */}
        {showEmailVerification && (
          <Alert className="bg-green-50 border-green-200">
            <Mail className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Check your email</AlertTitle>
            <AlertDescription className="text-green-700">
              We've sent a verification link to <strong>{signUpEmail}</strong>.
              Please verify your email before signing in.
            </AlertDescription>
          </Alert>
        )}

        {/* Auth Forms */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Join the conversation about Kenya's future
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin">
                <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      {...signInForm.register('email')}
                      disabled={signInForm.formState.isSubmitting}
                      className="bg-background"
                      autoComplete="email"
                      aria-invalid={!!signInForm.formState.errors.email}
                    />
                    {signInForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {signInForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password">Password</Label>
                      <Button
                        type="button"
                        variant="link"
                        className="text-xs px-0 h-auto font-normal"
                        onClick={() => setShowForgotPassword(true)}
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        {...signInForm.register('password')}
                        disabled={signInForm.formState.isSubmitting}
                        className="bg-background pr-10"
                        autoComplete="current-password"
                        aria-invalid={!!signInForm.formState.errors.password}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={signInForm.formState.isSubmitting}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {signInForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {signInForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  {signInForm.formState.errors.root && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {signInForm.formState.errors.root.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-civic-green hover:bg-civic-green/90"
                    disabled={signInForm.formState.isSubmitting}
                  >
                    {signInForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup">
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input
                      id="signup-username"
                      placeholder="Choose a username"
                      {...signUpForm.register('username')}
                      disabled={signUpForm.formState.isSubmitting}
                      className="bg-background"
                      autoComplete="username"
                      aria-invalid={!!signUpForm.formState.errors.username}
                    />
                    {signUpForm.formState.errors.username && (
                      <p className="text-sm text-destructive">
                        {signUpForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      {...signUpForm.register('email')}
                      disabled={signUpForm.formState.isSubmitting}
                      className="bg-background"
                      autoComplete="email"
                      aria-invalid={!!signUpForm.formState.errors.email}
                    />
                    {signUpForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {signUpForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        {...signUpForm.register('password')}
                        disabled={signUpForm.formState.isSubmitting}
                        className="bg-background pr-10"
                        autoComplete="new-password"
                        aria-invalid={!!signUpForm.formState.errors.password}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={signUpForm.formState.isSubmitting}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {signUpForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {signUpForm.formState.errors.password.message}
                      </p>
                    )}
                    <PasswordStrengthIndicator password={password} className="mt-2" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <Input
                      id="signup-confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      {...signUpForm.register('confirmPassword')}
                      disabled={signUpForm.formState.isSubmitting}
                      className="bg-background"
                      autoComplete="new-password"
                      aria-invalid={!!signUpForm.formState.errors.confirmPassword}
                    />
                    {signUpForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {signUpForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  {signUpForm.formState.errors.root && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {signUpForm.formState.errors.root.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-civic-blue hover:bg-civic-blue/90"
                    disabled={signUpForm.formState.isSubmitting}
                  >
                    {signUpForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      {/* Forgot Password Dialog */}
      <ForgotPasswordDialog open={showForgotPassword} onOpenChange={setShowForgotPassword} />
    </div>
  );
}
