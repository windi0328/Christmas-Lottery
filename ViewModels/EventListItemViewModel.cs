namespace ChristmasGiftExchange.ViewModels;

public class EventListItemViewModel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public DateTime RegistrationDeadline { get; set; }
    public string Location { get; set; } = string.Empty;
    public decimal Budget { get; set; }
    public int ParticipantCount { get; set; }
    public bool HasDrawResults { get; set; }
}
