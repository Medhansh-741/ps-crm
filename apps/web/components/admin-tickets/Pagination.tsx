type PaginationProps = {
  page: number
  totalPages: number
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, totalCount, pageSize, onPageChange }: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages)
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalCount)

  const pages = [
    1,
    Math.max(1, page - 1),
    page,
    Math.min(safeTotalPages, page + 1),
    safeTotalPages,
  ].filter((value, index, arr) => arr.indexOf(value) === index)

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="inline-flex items-center overflow-hidden rounded-lg border border-[#d7cfc3] bg-white text-[#2f2a25]">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="border-r border-[#dfd6ca] px-3 py-2 text-sm disabled:opacity-50"
        >
          ← Previous
        </button>

        <span className="px-3 py-2 text-sm">Page</span>

        {pages.map((entry) => (
          <button
            key={entry}
            type="button"
            onClick={() => onPageChange(entry)}
            className={`min-w-9 border-l border-[#dfd6ca] px-3 py-2 text-sm ${entry === page ? "bg-[#5a4437] text-white" : "bg-white"}`}
          >
            {entry}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotalPages, page + 1))}
          disabled={page >= safeTotalPages}
          className="border-l border-[#dfd6ca] px-3 py-2 text-sm disabled:opacity-50"
        >
          Next →
        </button>
      </div>

      <p className="text-sm font-medium text-[#3a332d]">
        Showing {start}-{end} of {new Intl.NumberFormat("en-IN").format(totalCount)} tickets
      </p>
    </div>
  )
}
