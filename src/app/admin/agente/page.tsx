import { AgentConfigView } from '@/dashboard/views/agent-config-view'
import { getAgentConfig } from '@/lib/admin/config/queries'

export default async function Page() {
  const { agentConfig, agentConfigVersions } = await getAgentConfig()

  return <AgentConfigView agentConfig={agentConfig} versions={agentConfigVersions} />
}
