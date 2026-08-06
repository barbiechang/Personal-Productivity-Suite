namespace ProductivitySuite.Api.Models;

public class DashboardImage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string DataUrl { get; set; } = string.Empty;
    public int Order { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
