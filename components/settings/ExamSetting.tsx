import Button from "@/components/button";
import Input from "@/components/input";
import Spacer from "@/components/spacer";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const ExamSetting = () => {
  return (
    <div className="max-w-xl">
      <div className="font-semibold text-lg">Exams</div>
      <div className="text-sm text-theme-gray mb-6">
        Default behaviour and rules applied to all assessments.
      </div>

      <div className="border rounded-lg p-6 mb-4">
        <div className="text-sm font-medium mb-4">Time & Attempts</div>

        <div className="text-xs text-theme-gray mb-1">Default Time Limit (minutes)</div>
        <Input name="timeLimit" type="number" placeholder="e.g. 60" />
        <Spacer size="sm" />

        <div className="text-xs text-theme-gray mb-1">Maximum Attempts per Student</div>
        <Input name="maxAttempts" type="number" placeholder="e.g. 1" />
        <Spacer size="md" />

        <div className="w-32">
          <Button title="Save Changes" loading={false} variant="fill" />
        </div>
      </div>

      <div className="border rounded-lg p-6 mb-4">
        <div className="text-sm font-medium mb-4">Exam Rules</div>

        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <div className="text-sm">Randomise Question Order</div>
            <div className="text-xs text-theme-gray">Shuffle questions for each student</div>
          </div>
          <Switch />
        </div>

        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <div className="text-sm">Randomise Option Order</div>
            <div className="text-xs text-theme-gray">Shuffle answer choices for objective questions</div>
          </div>
          <Switch />
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-sm">Show Score on Submission</div>
            <div className="text-xs text-theme-gray">Display result immediately after submission</div>
          </div>
          <Switch />
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <div className="text-sm font-medium mb-4">Auto-marking</div>

        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-sm">Enable Auto-marking</div>
            <div className="text-xs text-theme-gray">Automatically mark objective and subjective questions on submission</div>
          </div>
          <Switch defaultChecked />
        </div>
      </div>
    </div>
  );
};

export default ExamSetting;
