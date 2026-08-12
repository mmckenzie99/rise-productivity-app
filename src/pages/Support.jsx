import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Mail } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function Support() {
  return (
    <AuthLayout
      icon={LifeBuoy}
      title="RISE"
      subtitle="Support"
      footer={
        <>
          Ready to dive back in?{" "}
          <Link to="/" className="text-primary font-medium hover:underline">
            Go home
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <h2 className="text-2xl font-heading text-center text-foreground">Support</h2>
        <p className="text-sm text-muted-foreground text-center leading-relaxed">
          Have a question, run into an issue, or need a hand getting the most out
          of RISE? We're here to help — reach out and we'll get back to you as
          soon as we can.
        </p>
        <Button asChild className="w-full h-12 font-medium">
          <a href="mailto:bibleoptics@gmail.com?subject=RISE%20Support">
            <Mail className="w-4 h-4 mr-2" />
            Email Support
          </a>
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Or write to us directly at{" "}
          <a
            href="mailto:bibleoptics@gmail.com"
            className="text-primary font-medium hover:underline"
          >
            bibleoptics@gmail.com
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}