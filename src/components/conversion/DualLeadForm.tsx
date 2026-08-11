"use client";

import { useState } from "react";
import { LeadCaptureForm } from "./LeadCaptureForm";

export function DualLeadForm() {
  const [mode, setMode] = useState<"hr" | "client">("hr");

  return (
    <div>
      <div className="mb-6 flex gap-2 rounded-full border border-white/10 bg-black/20 p-1">
        <button
          type="button"
          onClick={() => setMode("hr")}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
            mode === "hr"
              ? "bg-[#f3c96a] text-black"
              : "text-white/70 hover:text-white"
          }`}
        >
          面试邀约
        </button>
        <button
          type="button"
          onClick={() => setMode("client")}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
            mode === "client"
              ? "bg-[#f3c96a] text-black"
              : "text-white/70 hover:text-white"
          }`}
        >
          合作需求
        </button>
      </div>

      <LeadCaptureForm
        type={mode}
        sourcePage="/author"
        title={mode === "hr" ? "发起面试沟通" : "提交合作需求"}
        description={
          mode === "hr"
            ? "填写岗位、团队信息和沟通方式后，线索会进入后台线索池。你也可以补充面试轮次、岗位级别和期望时间。"
            : "提交项目类型、预算范围、周期和目标后，需求会进入后台线索池，方便后续统一跟进。"
        }
        submitLabel={mode === "hr" ? "提交面试邀约" : "提交合作需求"}
      />
    </div>
  );
}
