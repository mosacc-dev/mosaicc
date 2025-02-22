"use client"
import { SignUp } from "@clerk/nextjs";



const SignUpPage = () => {

  return (<div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="p-6 bg-white rounded-lg shadow-md">
      <SignUp fallbackRedirectUrl="/menu" signInFallbackRedirectUrl="/menu" />
    </div>
  </div>)
};

export default SignUpPage;