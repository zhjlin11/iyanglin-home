type Props = {
  active: "jobs" | "companies" | "resumes";
};

const tabs = [
  { key: "jobs", label: "找工作", href: "/jobs", icon: "🔍" },
  { key: "companies", label: "找公司", href: "/jobs/companies", icon: "🏢" },
  { key: "resumes", label: "找人才", href: "/jobs/resumes", icon: "👤" },
  { key: "publish", label: "发职位", href: "/jobs/new", icon: "📝" },
] as const;

export default function JobSubNav({ active }: Props) {
  return (
    <nav className="job-subnav">
      {tabs.map((tab) => (
        <a
          key={tab.key}
          href={tab.href}
          className={`job-subnav-tab${active === tab.key ? " job-subnav-tab-active" : ""}`}
        >
          <span className="job-subnav-icon">{tab.icon}</span>
          {tab.label}
        </a>
      ))}
    </nav>
  );
}
