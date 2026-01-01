import { useCallback, useState } from "react";
import {
  Page,
  Layout,
  Card,
  Form,
  FormLayout,
  TextField,
  Select,
  Button,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function CreateTimer() {
  const [name, setName] = useState("");
  const [type, setType] = useState("fixed");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [productId, setProductId] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [aiIntent, setAiIntent] = useState("");
  const [aiHeadline, setAiHeadline] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setSaving(true);
      setSuccessMessage("");
      setErrorMessage("");

      try {
        if (!name || !productId) {
          setErrorMessage("Please fill in name and product ID.");
          setSaving(false);
          return;
        }

        let payload;

        if (type === "evergreen") {
          const minutes = Number(durationMinutes);
          if (!Number.isFinite(minutes) || minutes <= 0) {
            setErrorMessage("Please enter a valid duration in minutes.");
            setSaving(false);
            return;
          }

          const now = new Date();
          const end = new Date(now.getTime() + minutes * 60 * 1000);

          payload = {
            name,
            startAt: now.toISOString(),
            endAt: end.toISOString(),
            productId,
          };
        } else {
          if (!startAt || !endAt) {
            setErrorMessage("Please provide start and end date/time.");
            setSaving(false);
            return;
          }

          payload = {
            name,
            startAt,
            endAt,
            productId,
          };
        }

        const response = await fetch("/api/timers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          let message = "Failed to create timer.";
          try {
            const data = await response.json();
            if (data && data.error) {
              message = data.error;
            }
          } catch (e) {
            // ignore JSON parse errors
          }
          setErrorMessage(message);
        } else {
          const created = await response.json();
          setSuccessMessage(`Timer created (id: ${created.id}).`);
          setName("");
          setStartAt("");
          setEndAt("");
          setDurationMinutes("");
          setProductId("");
        }
      } catch (error) {
        console.error("Error creating timer", error);
        setErrorMessage("Unexpected error while creating timer.");
      } finally {
        setSaving(false);
      }
    },
    [name, type, startAt, endAt, durationMinutes, productId]
  );

  const timerTypeOptions = [
    { label: "Fixed", value: "fixed" },
    { label: "Evergreen", value: "evergreen" },
  ];

  const handleGenerateWithAi = useCallback(
    async () => {
      setErrorMessage("");
      setAiHeadline("");

      const trimmedIntent = aiIntent.trim();
      if (!trimmedIntent) {
        setErrorMessage("Please enter an intent for AI suggestions.");
        return;
      }
      if (trimmedIntent.length > 200) {
        setErrorMessage("Intent must be at most 200 characters.");
        return;
      }

      setAiLoading(true);
      try {
        const response = await fetch("/api/ai/suggest-timer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intent: trimmedIntent,
            productTitle: name || undefined,
          }),
        });

        if (!response.ok) {
          let message = "Failed to get AI suggestion.";
          try {
            const data = await response.json();
            if (data && data.error) {
              message = data.error;
            }
          } catch (_e) {
            // ignore
          }
          setErrorMessage(message);
          return;
        }

        const suggestion = await response.json();
        if (!suggestion) return;

        if (suggestion.type === "evergreen" || suggestion.type === "fixed") {
          setType(suggestion.type);
        }

        if (
          typeof suggestion.durationMinutes === "number" &&
          !Number.isNaN(suggestion.durationMinutes)
        ) {
          setDurationMinutes(String(suggestion.durationMinutes));
        }

        if (suggestion.headline && typeof suggestion.headline === "string") {
          setAiHeadline(suggestion.headline);
        }
      } catch (error) {
        console.error("Error generating AI suggestion", error);
        setErrorMessage("AI suggestion failed. Please try again or configure manually.");
      } finally {
        setAiLoading(false);
      }
    },
    [aiIntent, name]
  );

  return (
    <Page narrowWidth>
      <TitleBar title="Create Timer" />
      <Layout>
        <Layout.Section>
          {errorMessage ? (
            <Banner status="critical" title="Error">
              <p>{errorMessage}</p>
            </Banner>
          ) : null}
          {successMessage ? (
            <Banner status="success" title="Success">
              <p>{successMessage}</p>
            </Banner>
          ) : null}
          {aiHeadline ? (
            <Banner status="info" title="Suggested by AI">
              <p>{aiHeadline}</p>
            </Banner>
          ) : null}
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Form onSubmit={handleSubmit}>
              <FormLayout>
                <TextField
                  label="AI intent (optional)"
                  value={aiIntent}
                  onChange={setAiIntent}
                  maxLength={200}
                  multiline={2}
                  helpText="Describe what you want (e.g. 'Flash sale for new product launch')."
                />

                <Button
                  onClick={handleGenerateWithAi}
                  loading={aiLoading}
                  disabled={aiLoading}
                >
                  Generate with AI
                </Button>

                <TextField
                  label="Timer name"
                  value={name}
                  onChange={setName}
                  autoComplete="off"
                />

                <Select
                  label="Timer type"
                  options={timerTypeOptions}
                  value={type}
                  onChange={setType}
                />

                {type === "fixed" ? (
                  <>
                    <TextField
                      label="Start at"
                      type="datetime-local"
                      value={startAt}
                      onChange={setStartAt}
                      helpText="Local date/time when the timer starts"
                    />
                    <TextField
                      label="End at"
                      type="datetime-local"
                      value={endAt}
                      onChange={setEndAt}
                      helpText="Local date/time when the timer ends"
                    />
                  </>
                ) : (
                  <TextField
                    label="Duration (minutes)"
                    type="number"
                    value={durationMinutes}
                    onChange={setDurationMinutes}
                    helpText="How long the evergreen timer should run"
                  />
                )}

                <TextField
                  label="Product ID"
                  value={productId}
                  onChange={setProductId}
                  autoComplete="off"
                  helpText="Paste a product GID or ID from the Shopify URL"
                />

                <Button primary submit loading={saving}>
                  Save Timer
                </Button>
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
