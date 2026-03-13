import { formatDistanceToNow, format } from "date-fns";

export const safeFormatDistanceToNow = (dateInput: any, options?: any) => {
    try {
        if (!dateInput) return "just now";
        // Handle array format [yyyy, mm, dd...] from Java
        if (Array.isArray(dateInput)) {
            // Construct date from array parts
            const date = new Date(
                dateInput[0],
                (dateInput[1] || 1) - 1, // Month is 0-indexed
                dateInput[2] || 1,
                dateInput[3] || 0,
                dateInput[4] || 0,
                dateInput[5] || 0
            );
            if (isNaN(date.getTime())) return "just now";
            return formatDistanceToNow(date, options);
        }

        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return "just now";
        return formatDistanceToNow(date, options);
    } catch (error) {
        return "just now";
    }
};

export const safeFormatDate = (dateInput: any, formatStr: string = "PPP") => {
    try {
        if (!dateInput) return "N/A";

        let date: Date;
        if (Array.isArray(dateInput)) {
            date = new Date(
                dateInput[0],
                (dateInput[1] || 1) - 1,
                dateInput[2] || 1,
                dateInput[3] || 0,
                dateInput[4] || 0,
                dateInput[5] || 0
            );
        } else {
            date = new Date(dateInput);
        }

        if (isNaN(date.getTime())) return "N/A";
        return format(date, formatStr);
    } catch {
        return "N/A";
    }
};

export const safeToLocaleDateString = (dateInput: any) => {
    try {
        if (!dateInput) return "N/A";

        let date: Date;
        if (Array.isArray(dateInput)) {
            date = new Date(
                dateInput[0],
                (dateInput[1] || 1) - 1,
                dateInput[2] || 1,
                dateInput[3] || 0,
                dateInput[4] || 0,
                dateInput[5] || 0
            );
        } else {
            date = new Date(dateInput);
        }

        if (isNaN(date.getTime())) return "N/A";
        return date.toLocaleDateString();
    } catch {
        return "N/A";
    }
}
