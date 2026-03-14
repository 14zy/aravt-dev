import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Circle, PlayCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Learn = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-6xl mx-auto p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Aravt University</h1>
        <p className="text-xl text-gray-600">Knowledge about Aravts</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>What is Aravt?</CardTitle>
            <CardDescription>Understanding the basics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Aravt is a decentralized project management platform where teams
              collaborate on projects, share resources, and grow together. Each
              Aravt is a unique community with its own focus and goals.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quickstart</CardTitle>
            <CardDescription>
              Onboard into Aravt in 6 clear steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-gray-50 p-3">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-800">Progress</span>
                <span className="text-gray-500">1 / 6</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div className="h-2 w-1/6 rounded-full bg-blue-600" />
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="mb-1 flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-blue-700" />
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Current
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                Step 1: Understand about aravts
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Learn this page and click Next
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Next steps
              </p>

              <div className="flex items-start gap-2 rounded-lg border p-3">
                <Circle className="mt-0.5 h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Step 2: Complete your profile
                  </p>
                  <p className="text-sm text-gray-600">
                    Add full name, city, date of birth, and avatar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg border p-3">
                <Circle className="mt-0.5 h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Step 3: Link your wallet
                  </p>
                  <p className="text-sm text-gray-600">
                    Enable automatic rewards and payouts.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg border p-3">
                <Circle className="mt-0.5 h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Step 4: Join an Aravt
                  </p>
                  <p className="text-sm text-gray-600">
                    Browse teams and send a join request or accept an invite.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg border p-3">
                <Circle className="mt-0.5 h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Step 5: Explore the Feed
                  </p>
                  <p className="text-sm text-gray-600">
                    Follow creators and tune your subscriptions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg border p-3">
                <Circle className="mt-0.5 h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Step 6: Take on tasks
                  </p>
                  <p className="text-sm text-gray-600">
                    Submit completions and grow your rating over time.
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate("/profile")}
            >
              Start Step 2
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to Join</CardTitle>
            <CardDescription>Getting started with Aravt</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              1. Browse available Aravts
              <br />
              2. Find one that matches your interests
              <br />
              3. Submit a join request
              <br />
              4. Start collaborating once accepted
            </p>
            <Button onClick={() => navigate("/browse")} className="w-full">
              Browse Aravts
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects & Tasks</CardTitle>
            <CardDescription>How work is organized</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Each Aravt manages multiple projects. Projects are broken down
              into tasks that members can work on. Complete tasks to earn
              rewards and contribute to your Aravt's success.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rewards & Growth</CardTitle>
            <CardDescription>Benefits of participation</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              As you contribute to projects and complete tasks, you'll earn
              rewards and build your reputation within the Aravt community.
              Successful Aravts share in the benefits of their collective work.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Join Our Groups</CardTitle>
            <CardDescription>Other Online platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-left">
              Telegram:{" "}
              <a href="https://t.me/aravtforum" className="text-blue-700">
                Join our group
              </a>
              <br />
              <br />
              Youtube:{" "}
              <a
                href="http://youtube.com/@aravtsystems"
                className="text-blue-700"
              >
                Subscribe to tutorials channel
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Learn;
