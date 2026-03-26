namespace ChristmasGiftExchange.ViewModels;

public class EventDetailsViewModel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public DateTime RegistrationDeadline { get; set; }
    public string Location { get; set; } = string.Empty;
    public decimal Budget { get; set; }
    public bool HasDrawResults { get; set; }
    public ParticipantFormViewModel NewParticipant { get; set; } = new();
    public IReadOnlyList<ParticipantSummaryViewModel> Participants { get; set; } = [];
}

public class ParticipantSummaryViewModel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? WishlistHint { get; set; }
    public string AccessCode { get; set; } = string.Empty;
    public string RevealUrl { get; set; } = string.Empty;
}
