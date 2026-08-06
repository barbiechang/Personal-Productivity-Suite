namespace ProductivitySuite.Api.Models;

public class VocabWord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Word { get; set; } = string.Empty;
    public string Meaning { get; set; } = string.Empty;
    public string? ExampleSentence { get; set; }
    public bool IsLearned { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
