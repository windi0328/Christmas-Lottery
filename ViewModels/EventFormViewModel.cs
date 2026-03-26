using System.ComponentModel.DataAnnotations;

namespace ChristmasGiftExchange.ViewModels;

public class EventFormViewModel
{
    [Required, StringLength(80)]
    [Display(Name = "活動名稱")]
    public string Name { get; set; } = string.Empty;

    [Required, StringLength(500)]
    [Display(Name = "活動描述")]
    public string Description { get; set; } = string.Empty;

    [Required]
    [Display(Name = "活動日期")]
    public DateTime EventDate { get; set; } = DateTime.Today.AddDays(14).AddHours(19);

    [Required]
    [Display(Name = "活動地點")]
    [StringLength(120)]
    public string Location { get; set; } = string.Empty;

    [Required]
    [Display(Name = "報名截止日期")]
    public DateTime RegistrationDeadline { get; set; } = DateTime.Today.AddDays(10).AddHours(23);

    [Range(1, 50000)]
    [Display(Name = "預算金額")]
    public decimal Budget { get; set; } = 1000;
}
