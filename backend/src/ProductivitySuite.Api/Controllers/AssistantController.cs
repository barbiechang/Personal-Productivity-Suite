using Microsoft.AspNetCore.Mvc;

namespace ProductivitySuite.Api.Controllers;

public record ChatMessage(string Role, string Content);
public record ChatRequest(List<ChatMessage> Messages);
public record ChatResponse(string Reply);

[ApiController]
[Route("api/assistant")]
public class AssistantController : ControllerBase
{
    // Placeholder: wire this up to Claude (Anthropic API) or another LLM provider.
    [HttpPost("chat")]
    public ActionResult<ChatResponse> Chat(ChatRequest request)
    {
        var lastUserMessage = request.Messages.LastOrDefault(m => m.Role == "user")?.Content ?? string.Empty;
        return Ok(new ChatResponse($"Echo: {lastUserMessage}"));
    }
}
