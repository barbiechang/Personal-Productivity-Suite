namespace ProductivitySuite.Api.Models;

public class Expense
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Category { get; set; } = "Other";
    public DateTime Date { get; set; } = DateTime.UtcNow;
}
