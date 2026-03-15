import {
  CheckCircleFilled,
  CloseCircleFilled,
  LinkOutlined,
  ReloadOutlined,
  RobotOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { ScrollArea } from "@renderer/components/ScrollArea";
import { useAppI18n } from "@renderer/i18n/AppI18nProvider";
import { translateUiText } from "@renderer/i18n/uiTranslations";
import { api } from "@renderer/lib/api";
import { openUrl } from "@renderer/lib/openUrl";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Card, Space, Tag, Typography, message } from "antd";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type AutoSetupTarget = "node-pnpm" | "claude-code" | "channels";

const NODE_PNPM_INSTALL_COMMANDS = String.raw`# Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash

# in lieu of restarting the shell
\. "$HOME/.nvm/nvm.sh"

# Download and install Node.js:
nvm install 24

# Verify the Node.js version:
node -v # Should print "v24.14.0".

# Download and install pnpm:
corepack enable pnpm

# Verify pnpm version:
pnpm -v`;

const CLAUDE_CODE_INSTALL_COMMAND =
  "curl -fsSL https://claude.ai/install.sh | bash";

const AUTO_SETUP_PROMPTS: Record<AutoSetupTarget, string> = {
  "node-pnpm":
    "请帮我检查并安装 Node.js 与 pnpm。优先使用 nvm 安装 Node.js 24，再执行 corepack enable pnpm。完成后请验证 node -v 和 pnpm -v，并把执行结果发给我。",
  "claude-code":
    "请帮我安装 Claude Code（命令：curl -fsSL https://claude.ai/install.sh | bash），安装后请验证 claude --version，并告诉我下一步如何开始使用。",
  channels:
    "请帮我完成 Kian 的渠道配置准备：先判断我更适合 Telegram、Discord 还是飞书；给出最短配置步骤；最后引导我在设置-渠道中完成必填项并启用。",
};

const StatusTag = ({
  installed,
  version,
}: {
  installed: boolean;
  version?: string;
}) =>
  installed ? (
    <Tag color="success" className="!m-0">
      已安装{version ? ` · ${version}` : ""}
    </Tag>
  ) : (
    <Tag color="default" className="!m-0">
      未安装
    </Tag>
  );

export const GuidePage = () => {
  const { language } = useAppI18n();
  const navigate = useNavigate();
  const [showNodeCommands, setShowNodeCommands] = useState(false);
  const [showClaudeCommand, setShowClaudeCommand] = useState(false);

  const envQuery = useQuery({
    queryKey: ["onboarding", "environment"],
    queryFn: api.onboarding.getEnvironmentStatus,
  });

  const channelsQuery = useQuery({
    queryKey: ["onboarding", "channels"],
    queryFn: async () => {
      const [telegram, discord, feishu] = await Promise.all([
        api.settings.getTelegramChatChannelStatus(),
        api.settings.getDiscordChatChannelStatus(),
        api.settings.getFeishuChatChannelStatus(),
      ]);
      return { telegram, discord, feishu };
    },
  });

  const hasConfiguredChannel = useMemo(() => {
    const value = channelsQuery.data;
    if (!value) return false;
    return [value.telegram, value.discord, value.feishu].some(
      (item) => item.configured,
    );
  }, [channelsQuery.data]);

  const autoSetupMutation = useMutation({
    mutationFn: async (target: AutoSetupTarget) => {
      const session = await api.chat.createSession({
        scope: { type: "main" },
        module: "main",
        title: translateUiText(language, "引导自动配置"),
      });

      await api.chat.sendMessage({
        scope: { type: "main" },
        module: "main",
        sessionId: session.id,
        message: translateUiText(language, AUTO_SETUP_PROMPTS[target]),
      });

      return { sessionId: session.id };
    },
    onSuccess: () => {
      message.success("已向 Kian 发送自动配置请求");
      navigate("/main-agent");
    },
    onError: (error) => {
      message.error(
        error instanceof Error ? error.message : "自动配置请求发送失败",
      );
    },
  });

  const refreshChecks = useCallback(() => {
    void Promise.all([envQuery.refetch(), channelsQuery.refetch()]);
  }, [channelsQuery, envQuery]);

  const openMainAgent = useCallback(() => {
    navigate("/main-agent");
  }, [navigate]);

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-4 px-5 pb-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Typography.Title level={3} className="!mb-1 !text-slate-900">
              快速引导
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 !text-slate-600">
              完成基础环境后，你就可以把开发和协作任务交给 Kian。
            </Typography.Paragraph>
          </div>
          <Button
            icon={<ReloadOutlined />}
            loading={envQuery.isFetching || channelsQuery.isFetching}
            onClick={refreshChecks}
          >
            重新检测
          </Button>
        </div>

        <Card bordered={false} className="!rounded-xl !bg-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Typography.Title level={4} className="!mb-1 !text-slate-900">
                主 Agent 入口
              </Typography.Title>
              <Typography.Text className="!text-slate-600">
                主 Agent 会负责接待你，并在需要时把任务委派给对应的子智能体。
              </Typography.Text>
            </div>
            <Space wrap>
              <Button type="primary" size="middle" onClick={openMainAgent}>
                打开主 Agent
              </Button>
              <Button size="middle" onClick={() => navigate("/")}>
                前往 Agent 列表
              </Button>
            </Space>
          </div>
        </Card>

        <Card bordered={false} className="!rounded-xl !bg-white">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Typography.Title level={4} className="!mb-1 !text-slate-900">
                  Node.js 与 pnpm
                </Typography.Title>
                <Typography.Paragraph className="!mb-0 !text-slate-600">
                  启用后，你可以使用应用模块开发前端应用，也可以快速构建各类小应用和小游戏。
                </Typography.Paragraph>
              </div>
              <Space size={8} align="center">
                {envQuery.data ? (
                  <>
                    <StatusTag
                      installed={envQuery.data.node.installed}
                      version={envQuery.data.node.version}
                    />
                    <StatusTag
                      installed={envQuery.data.pnpm.installed}
                      version={envQuery.data.pnpm.version}
                    />
                  </>
                ) : (
                  <Tag className="!m-0">检测中</Tag>
                )}
              </Space>
            </div>

            <Space wrap>
              <Button
                icon={<ToolOutlined />}
                onClick={() => setShowNodeCommands((value) => !value)}
              >
                {showNodeCommands ? "隐藏手动配置" : "手动配置"}
              </Button>
              <Button
                icon={<RobotOutlined />}
                loading={autoSetupMutation.isPending}
                onClick={() => autoSetupMutation.mutate("node-pnpm")}
              >
                让 Kian 自动配置
              </Button>
            </Space>

            {showNodeCommands ? (
              <div className="flex flex-col gap-2">
                <div className="rounded-lg border border-slate-200 bg-slate-900 p-3">
                  <pre className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-100">
                    {NODE_PNPM_INSTALL_COMMANDS}
                  </pre>
                </div>
                <Button
                  size="small"
                  type="link"
                  icon={<LinkOutlined />}
                  className="!h-auto !w-fit !px-0"
                  onClick={() => void openUrl("https://nodejs.org/en/download")}
                >
                  打开 Node.js 下载页
                </Button>
              </div>
            ) : null}
          </div>
        </Card>

        <Card bordered={false} className="!rounded-xl !bg-white">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Typography.Title level={4} className="!mb-1 !text-slate-900">
                  Claude Code
                </Typography.Title>
                <Typography.Paragraph className="!mb-0 !text-slate-600">
                  启用后，你可以把编程任务直接委托给 Kian，由它在对应 Agent
                  工作区中执行并反馈结果。
                </Typography.Paragraph>
              </div>
              {envQuery.data ? (
                <StatusTag
                  installed={envQuery.data.claudeCode.installed}
                  version={envQuery.data.claudeCode.version}
                />
              ) : (
                <Tag className="!m-0">检测中</Tag>
              )}
            </div>

            <Space wrap>
              <Button
                icon={<ToolOutlined />}
                onClick={() => setShowClaudeCommand((value) => !value)}
              >
                {showClaudeCommand ? "隐藏手动配置" : "手动配置"}
              </Button>
              <Button
                icon={<RobotOutlined />}
                loading={autoSetupMutation.isPending}
                onClick={() => autoSetupMutation.mutate("claude-code")}
              >
                让 Kian 自动配置
              </Button>
            </Space>

            {showClaudeCommand ? (
              <div className="flex flex-col gap-2">
                <div className="rounded-lg border border-slate-200 bg-slate-900 p-3">
                  <pre className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-100">
                    {CLAUDE_CODE_INSTALL_COMMAND}
                  </pre>
                </div>
                <Button
                  size="small"
                  type="link"
                  icon={<LinkOutlined />}
                  className="!h-auto !w-fit !px-0"
                  onClick={() =>
                    void openUrl(
                      "https://code.claude.com/docs/en/overview#terminal",
                    )
                  }
                >
                  打开 Claude Code 文档
                </Button>
              </div>
            ) : null}
          </div>
        </Card>

        <Card bordered={false} className="!rounded-xl !bg-white">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Typography.Title level={4} className="!mb-1 !text-slate-900">
                  渠道配置
                </Typography.Title>
                <Typography.Paragraph className="!mb-0 !text-slate-600">
                  启用后，你可以在手机端通过 IM 聊天工具远程控制 Kian。
                </Typography.Paragraph>
              </div>
              <Tag
                color={hasConfiguredChannel ? "success" : "default"}
                className="!m-0"
              >
                {hasConfiguredChannel ? (
                  <span className="inline-flex items-center gap-1">
                    <CheckCircleFilled />
                    已配置
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <CloseCircleFilled />
                    未配置
                  </span>
                )}
              </Tag>
            </div>

            <Space wrap>
              <Button
                icon={<ToolOutlined />}
                onClick={() => navigate("/settings?tab=channels")}
              >
                手动配置
              </Button>
              <Button
                icon={<RobotOutlined />}
                loading={autoSetupMutation.isPending}
                onClick={() => autoSetupMutation.mutate("channels")}
              >
                让 Kian 自动配置
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    </ScrollArea>
  );
};
