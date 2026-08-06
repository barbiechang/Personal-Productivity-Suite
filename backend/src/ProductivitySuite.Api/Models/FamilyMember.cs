namespace ProductivitySuite.Api.Models;

public class FamilyMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Role { get; set; }
    public DateOnly Birthday { get; set; }
    public string Emoji { get; set; } = "👤";
    public string? PhotoDataUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
