using System.ComponentModel.DataAnnotations;

namespace ChristmasGiftExchange.ViewModels;

public class RevealGiftViewModel
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public string EventDescription { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public string Location { get; set; } = string.Empty;
    public decimal Budget { get; set; }

    [Display(Name = "我是誰")]
    public int? ParticipantId { get; set; }

    [Required, StringLength(20)]
    [Display(Name = "專屬通關碼")]
    public string AccessCode { get; set; } = string.Empty;

    public string? VerifiedParticipantName { get; set; }
    public string? MatchedParticipantName { get; set; }
    public string? Hint { get; set; }
    public bool CanReveal => !string.IsNullOrWhiteSpace(VerifiedParticipantName) && !string.IsNullOrWhiteSpace(MatchedParticipantName);
    public IReadOnlyList<RevealParticipantOptionViewModel> Participants { get; set; } = [];
}

public class RevealParticipantOptionViewModel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
